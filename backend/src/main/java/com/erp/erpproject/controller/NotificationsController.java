package com.erp.erpproject.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.erp.erpproject.security.UserPrincipal;
import com.erp.erpproject.service.NotificationsService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import com.erp.erpproject.model.Notifications;

@RestController
@RequestMapping("/notifications")
public class NotificationsController {

    @Autowired
    private NotificationsService notificationsService;

    @GetMapping("/unread")
    public List<Notifications> getUnreadNotificationsByAccountId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return notificationsService.getUnreadNotificationsByAccountId(userPrincipal.getAccountId());
    }
    @PostMapping("/read")
    public void readNotification(@RequestParam String notificationId) {
        notificationsService.readNotification(notificationId);
    }
}
