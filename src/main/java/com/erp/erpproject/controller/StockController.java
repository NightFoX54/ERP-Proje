package com.erp.erpproject.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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
import com.erp.erpproject.service.StockService;

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
    public Product createProduct(@RequestBody Product product) {
        return stockService.createProduct(product);
    }
    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable String id) {
        stockService.deleteProduct(id);
    }
    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable String id, @RequestBody Product product) {
        return stockService.updateProduct(id, product);
    }
    @GetMapping("/product-categories/{id}")
    public ProductCategoryDto getProductCategoryById(@PathVariable String id) {
        return stockService.getProductCategoryById(id);
    }
    @GetMapping("/product-categories")
    public List<ProductCategories> getProductCategories() {
        return stockService.getProductCategories();
    }
    @PostMapping("/product-categories")
    public ProductCategories createProductCategory(@RequestBody ProductCategories productCategory) {
        return stockService.createProductCategory(productCategory);
    }
}
