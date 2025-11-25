package com.erp.erpproject.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.erp.erpproject.dto.ProductCategoryDto;
import com.erp.erpproject.model.Product;
import com.erp.erpproject.model.ProductCategories;
import com.erp.erpproject.model.ProductType;
import com.erp.erpproject.service.StockService;
import com.erp.erpproject.util.SecurityUtil;

@RestController
@RequestMapping("/api/stock")
public class StockController {
    @Autowired
    private StockService stockService;
    @GetMapping
    public List<Product> getProducts() {
        return stockService.getProducts();
    }
    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        return stockService.createProduct(product);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        return stockService.deleteProduct(id);
    }
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable String id, @RequestBody Product product) {
        return stockService.updateProduct(id, product);
    }
    @GetMapping("/product-categories/{id}")
    public ProductCategoryDto getProductCategoryById(@PathVariable String id) {
        return stockService.getProductCategoryById(id);
    }
    @GetMapping("/product-categories/{id}/branch")
    public List<ProductCategories> getProductCategories(@PathVariable String id) {
        return stockService.getProductCategories(id);
    }
    @PostMapping("/product-categories")
    public ResponseEntity<ProductCategories> createProductCategory(@RequestBody ProductCategories productCategory) {
        if (!SecurityUtil.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
        return ResponseEntity.ok().body(stockService.createProductCategory(productCategory));
    }
    @PostMapping("/product-types")
    public ProductType createProductType(@RequestBody ProductType productType) {
        return stockService.createProductType(productType);
    }
    @GetMapping("/product-types")
    public List<ProductType> getAllProductTypes() {
        return stockService.getAllProductTypes();
    }
}
