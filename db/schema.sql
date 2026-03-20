-- ============================================================
-- Mini Event Management System — MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS event_booking;
USE event_booking;

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name       VARCHAR(150)    NOT NULL,
    email      VARCHAR(255)    NOT NULL,
    created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Events
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    title             VARCHAR(255)    NOT NULL,
    description       TEXT,
    date              DATETIME        NOT NULL,
    total_capacity    INT UNSIGNED    NOT NULL,
    remaining_tickets INT UNSIGNED    NOT NULL,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_capacity CHECK (remaining_tickets <= total_capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Bookings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id      INT UNSIGNED    NOT NULL,
    event_id     INT UNSIGNED    NOT NULL,
    booking_date DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    booking_code CHAR(36)        NOT NULL COMMENT 'UUID v4 unique ticket code',
    PRIMARY KEY (id),
    UNIQUE KEY uq_bookings_code (booking_code),
    UNIQUE KEY uq_bookings_user_event (user_id, event_id)  COMMENT 'One booking per user per event',
    CONSTRAINT fk_bookings_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    CONSTRAINT fk_bookings_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Event Attendance
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_attendance (
    id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    booking_id INT UNSIGNED    NOT NULL,
    user_id    INT UNSIGNED    NOT NULL,
    entry_time DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attendance_booking (booking_id)  COMMENT 'One check-in per booking',
    CONSTRAINT fk_attendance_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Seed: Sample users (optional, for quick testing)
-- ------------------------------------------------------------
INSERT IGNORE INTO users (name, email) VALUES
    ('Alice Johnson', 'alice@example.com'),
    ('Bob Smith',     'bob@example.com'),
    ('Carol White',   'carol@example.com');
