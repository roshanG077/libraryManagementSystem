package com.finlogic.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Provides database connections.
 * NOTE: For production, replace with a connection pool (e.g. HikariCP or DBCP2).
 */
public class DBConnection {

    private static final String URL = "jdbc:mysql://127.0.0.1:3306/library_management";
private static final String USER = "root";
private static final String PASSWORD = "RoshanGupta@09";
    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("[DBConnection] MySQL JDBC driver not found!");
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}