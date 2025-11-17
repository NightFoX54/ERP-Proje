package com.erp.erpproject.dto;

import java.util.List;

import com.erp.erpproject.model.Product;
import com.erp.erpproject.model.ProductCategories;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductCategoryDto {
    ProductCategories productCategories;
    List<Product> products;
}
