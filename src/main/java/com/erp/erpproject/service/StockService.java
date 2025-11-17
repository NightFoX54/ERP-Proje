package com.erp.erpproject.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.erp.erpproject.dto.ProductCategoryDto;
import com.erp.erpproject.model.Product;
import com.erp.erpproject.model.ProductCategories;
import com.erp.erpproject.repository.BranchesRepository;
import com.erp.erpproject.repository.ProductCategoriesRepository;
import com.erp.erpproject.repository.ProductRepository;
import com.erp.erpproject.repository.ProductTypeRepository;

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
    public Product createProduct(Product product) {
        if (productCategoriesRepository.findById(product.getProductCategoryId()).isEmpty()) {
            throw new RuntimeException("Product category not found");
        }
        return productRepository.save(product);
    }
    public Product updateProduct(String id, Product product) {
        if (productRepository.findById(id).isEmpty()) {
            throw new RuntimeException("Product not found");
        }
        Product existingProduct = productRepository.findById(id).get();
        existingProduct.setProductCategoryId(product.getProductCategoryId());
        existingProduct.setWeight(product.getWeight());
        existingProduct.setLength(product.getLength());
        existingProduct.setPurchasePrice(product.getPurchasePrice());
        existingProduct.setStock(product.getStock());
        existingProduct.setFields(product.getFields());
        return productRepository.save(existingProduct);
    }
    public void deleteProduct(String id) {
        if (productRepository.findById(id).isEmpty()) {
            throw new RuntimeException("Product not found");
        }
        productRepository.deleteById(id);
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
    public List<ProductCategories> getProductCategories() {
        return productCategoriesRepository.findAll();
    }
    
}
