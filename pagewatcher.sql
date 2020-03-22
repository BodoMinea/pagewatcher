-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2.1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Mar 22, 2020 at 06:34 PM
-- Server version: 5.7.29-0ubuntu0.16.04.1
-- PHP Version: 7.0.33-0ubuntu0.16.04.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pagewatcher`
--

-- --------------------------------------------------------

--
-- Table structure for table `watchers`
--

CREATE TABLE `watchers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `friendly_name` varchar(100) COLLATE utf8_bin NOT NULL,
  `url` varchar(3000) COLLATE utf8_bin NOT NULL,
  `check_interval` int(11) NOT NULL,
  `inexact_timing` tinyint(1) DEFAULT NULL,
  `add_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `add_user` varchar(100) COLLATE utf8_bin NOT NULL,
  `add_ip` varchar(100) COLLATE utf8_bin NOT NULL,
  `checked_times` int(11) NOT NULL DEFAULT '1',
  `last_checked` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_content` mediumtext COLLATE utf8_bin NOT NULL,
  `alert_email` tinyint(1) DEFAULT NULL,
  `alert_webhooks` tinyint(1) DEFAULT NULL,
  `alert_syshooks` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
