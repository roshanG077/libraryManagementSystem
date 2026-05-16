package com.finlogic.servlet;

import com.finlogic.dao.MemberDAO;
import com.finlogic.model.Member;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

public class AddMemberServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String name  = request.getParameter("name");
        String email = request.getParameter("email");
        String phoneParam = request.getParameter("phone");

        // Basic validation
        if (name  == null || name.isBlank() ||
            email == null || email.isBlank() ||
            phoneParam == null || phoneParam.isBlank()) {
            response.sendRedirect("addmember.html?error=missing_fields");
            return;
        }

        long phone;
        try {
            phone = Long.parseLong(phoneParam.trim().replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            response.sendRedirect("addmember.html?error=invalid_phone");
            return;
        }

        Member member = new Member(name.trim(), email.trim(), phone);
        int result = MemberDAO.addMember(member);

        if (result > 0) {
            response.sendRedirect("members.html?success=added");
        } else {
            response.sendRedirect("addmember.html?error=db_error");
        }
    }
}