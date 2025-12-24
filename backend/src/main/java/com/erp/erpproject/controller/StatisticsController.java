package com.erp.erpproject.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.erp.erpproject.dto.DateRangeDto;
import com.erp.erpproject.dto.PurchasedProductStatisticsDto;
import com.erp.erpproject.dto.StatisticsPurchaseTotalDTO;
import com.erp.erpproject.dto.StatisticsSoldProductsDto;
import com.erp.erpproject.dto.StatisticsSoldTotalDTO;
import com.erp.erpproject.security.UserPrincipal;
import com.erp.erpproject.service.StatisticsService;

@RestController
@RequestMapping("api/statistics")
public class StatisticsController {
    private final StatisticsService statisticsService;
    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @PostMapping("/purchased-products-between-dates")
    public Map<String,Map<String, List<PurchasedProductStatisticsDto>>> getPurchasedProductsBetweenDates(@RequestBody DateRangeDto dateRange) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return statisticsService.getPurchasedProductsBetweenDates(dateRange.getStartDate(), dateRange.getEndDate(), userPrincipal);
    }

    @PostMapping("/purchased-products-between-dates/total")
    public ResponseEntity<StatisticsPurchaseTotalDTO> getPurchasedProductsBetweenDatesTotal(@RequestBody DateRangeDto dateRange) {
        return statisticsService.getPurchasedProductsBetweenDatesTotal(dateRange.getStartDate(), dateRange.getEndDate());
    }
    @PostMapping("/sold-products-between-dates")
    public Map<String,Map<String,Map<String,List<StatisticsSoldProductsDto>>>> getSoldProductsBetweenDates(@RequestBody DateRangeDto dateRange) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return statisticsService.getSoldProductsBetweenDates(dateRange.getStartDate(), dateRange.getEndDate(), userPrincipal);
    }
    @PostMapping("/sold-products-between-dates/total")
    public ResponseEntity<StatisticsSoldTotalDTO> getSoldProductsBetweenDatesTotal(@RequestBody DateRangeDto dateRange) {
        return statisticsService.getSoldProductsBetweenDatesTotal(dateRange.getStartDate(), dateRange.getEndDate());
    }
}
