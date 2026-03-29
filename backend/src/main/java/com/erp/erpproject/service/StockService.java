package com.erp.erpproject.service;

import java.util.Date;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.erp.erpproject.dto.AddStockRequestDto;
import com.erp.erpproject.dto.ProductCategoryDto;
import com.erp.erpproject.model.Product;
import com.erp.erpproject.model.ProductCategories;
import com.erp.erpproject.model.ProductType;
import com.erp.erpproject.repository.BranchesRepository;
import com.erp.erpproject.repository.ProductCategoriesRepository;
import com.erp.erpproject.repository.ProductRepository;
import com.erp.erpproject.repository.ProductTypeRepository;
import com.erp.erpproject.util.SecurityUtil;

@Service
public class StockService {
    private final ProductRepository productRepository;
    private final ProductCategoriesRepository productCategoriesRepository;
    private final ProductTypeRepository productTypeRepository;
    private final BranchesRepository branchesRepository;
    public StockService(ProductRepository productRepository, ProductCategoriesRepository productCategoriesRepository, ProductTypeRepository productTypeRepository, BranchesRepository branchesRepository) {
        this.productRepository = productRepository;
        this.productCategoriesRepository = productCategoriesRepository;
        this.productTypeRepository = productTypeRepository;
        this.branchesRepository = branchesRepository;
    }
    public List<Product> getProducts() {
        return productRepository.findAll();
    }
    public ResponseEntity<Product> createProduct(Product product) {
        ProductCategories productCategory = productCategoriesRepository.findById(product.getProductCategoryId()).get();
        if (!productCategory.getBranchId().equals(SecurityUtil.getCurrentBranchId()) && !SecurityUtil.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
        if(product.getPurchasePrice() != null){
            product.setKgPrice(product.getPurchasePrice() / product.getWeight());
        }
        else{
            product.setPurchasePrice(product.getKgPrice() * product.getWeight());
        }
        product.setCreatedAt(new Date());
        product.setIsActive(true);
        product.setPurchaseLength(product.getLength());
        product.setPurchaseWeight(product.getWeight());
        product.setPurchaseStock(product.getStock());
        String innerDiameter = null;
        if(product.getFields().containsKey("iç çap")){
            innerDiameter = product.getFields().get("iç çap").toString();
        }
        product.setAnalyticsKey(product.getProductCategoryId() + "-" + product.getDiameter().toString() + "-" + innerDiameter);
        return ResponseEntity.ok().body(productRepository.save(product));
    }
    public ResponseEntity<Product> updateProduct(String id, Product product) {
        if (productRepository.findById(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        ProductCategories productCategory = productCategoriesRepository.findById(product.getProductCategoryId()).get();
        if (!productCategory.getBranchId().equals(SecurityUtil.getCurrentBranchId()) && !SecurityUtil.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
        Product existingProduct = productRepository.findById(id).get();
        existingProduct.setProductCategoryId(product.getProductCategoryId());
        existingProduct.setDiameter(product.getDiameter());
        existingProduct.setWeight(product.getWeight());
        existingProduct.setLength(product.getLength());
        existingProduct.setStock(product.getStock());
        existingProduct.setFields(product.getFields());
        
        // purchasePrice veya kgPrice'tan birini kullanarak diğerini hesapla
        if(product.getKgPrice() != null && product.getKgPrice() != 0){
            existingProduct.setKgPrice(product.getKgPrice());
            existingProduct.setPurchasePrice(product.getKgPrice() * product.getWeight());
        }
        else if(product.getPurchasePrice() != null && product.getPurchasePrice() != 0){
            existingProduct.setPurchasePrice(product.getPurchasePrice());
            existingProduct.setKgPrice(product.getPurchasePrice() / product.getWeight());
        }
        else {
            // Eğer ikisi de null ise, mevcut değerleri koru
            if(product.getPurchasePrice() != null) {
                existingProduct.setPurchasePrice(product.getPurchasePrice());
            }
            if(product.getKgPrice() != null) {
                existingProduct.setKgPrice(product.getKgPrice());
            }
        }
        
        return ResponseEntity.ok().body(productRepository.save(existingProduct));
    }
    public ResponseEntity<Void> deleteProduct(String id) {
        if (productRepository.findById(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        ProductCategories productCategory = productCategoriesRepository.findById(productRepository.findById(id).get().getProductCategoryId()).get();
        if (!productCategory.getBranchId().equals(SecurityUtil.getCurrentBranchId()) && !SecurityUtil.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
        productRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
    public List<Product> getProductsByProductCategoryId(String productCategoryId) {
        if (productCategoriesRepository.findById(productCategoryId).isEmpty()) {
            throw new RuntimeException("Product category not found");
        }
        return productRepository.findAllByProductCategoryId(productCategoryId);
    }
    public ProductCategoryDto getProductCategoryById(String productCategoryId) {
        if (productCategoriesRepository.findById(productCategoryId).isEmpty()) {
            throw new RuntimeException("Product category not found");
        }
        ProductCategories productCategories = productCategoriesRepository.findById(productCategoryId).get();
        List<Product> products = productRepository.findAllByProductCategoryId(productCategoryId);
        return new ProductCategoryDto(productCategories, products);
    }
    public ProductCategories createProductCategory(ProductCategories productCategory) {
        if (productTypeRepository.findById(productCategory.getProductTypeId()).isEmpty()) {
            throw new RuntimeException("Product type not found");
        }
        if (branchesRepository.findById(productCategory.getBranchId()).isEmpty()) {
            throw new RuntimeException("Branch not found");
        }
        return productCategoriesRepository.save(productCategory);
    }
    public List<ProductCategories> getProductCategories(String branchId) {
        if (branchesRepository.findById(branchId).isEmpty()) {
            throw new RuntimeException("Branch not found");
        }
        return productCategoriesRepository.findAllByBranchId(branchId);
    }
    public ProductType createProductType(ProductType productType) {
        return productTypeRepository.save(productType);
    }
    public List<ProductType> getAllProductTypes() {
        return productTypeRepository.findAll();
    }
    public ResponseEntity<Void> deleteProductCategory(String id) {
        if (productCategoriesRepository.findById(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        productCategoriesRepository.deleteById(id);
        productRepository.deleteAllByProductCategoryId(id);
        return ResponseEntity.ok().build();
    }
    public List<Product> getProductsByProductCategoryIdAndDiameter(String id, Double diameter) {
        if (productCategoriesRepository.findById(id).isEmpty()) {
            throw new RuntimeException("Product category not found");
        }
        return productRepository.findAllByProductCategoryIdAndDiameter(id, diameter);
    }

    public ResponseEntity<Product> addStock(String id, AddStockRequestDto request) {
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        ProductCategories productCategory = productCategoriesRepository.findById(product.getProductCategoryId()).get();
        if (!productCategory.getBranchId().equals(SecurityUtil.getCurrentBranchId()) && !SecurityUtil.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        double addedWeight = request.getAddedWeight() != null ? request.getAddedWeight() : 0.0;
        int addedStock = request.getAddedStock() != null ? request.getAddedStock() : 0;

        double currentWeight = product.getWeight() != null ? product.getWeight() : 0.0;
        double currentPurchaseWeight = product.getPurchaseWeight() != null ? product.getPurchaseWeight() : 0.0;
        int currentStock = product.getStock() != null ? product.getStock() : 0;
        int currentPurchaseStock = product.getPurchaseStock() != null ? product.getPurchaseStock() : 0;
        double currentPurchasePrice = product.getPurchasePrice() != null ? product.getPurchasePrice() : 0.0;

        product.setWeight(currentWeight + addedWeight);
        product.setPurchaseWeight(currentPurchaseWeight + addedWeight);
        product.setStock(currentStock + addedStock);
        product.setPurchaseStock(currentPurchaseStock + addedStock);

        double newPurchaseWeight = currentPurchaseWeight + addedWeight;

        if (request.getTotalPurchasePrice() != null) {
            double newPurchasePrice = currentPurchasePrice + request.getTotalPurchasePrice();
            product.setPurchasePrice(newPurchasePrice);
            if (newPurchaseWeight > 0) {
                product.setKgPrice(newPurchasePrice / newPurchaseWeight);
            }
        } else if (request.getKgPrice() != null) {
            double addedTotalPrice = request.getKgPrice() * addedWeight;
            double newPurchasePrice = currentPurchasePrice + addedTotalPrice;
            product.setPurchasePrice(newPurchasePrice);
            if (newPurchaseWeight > 0) {
                product.setKgPrice(newPurchasePrice / newPurchaseWeight);
            }
        }

        return ResponseEntity.ok(productRepository.save(product));
    }
}
