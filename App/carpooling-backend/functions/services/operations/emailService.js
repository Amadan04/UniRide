/**
 * Email Notification Service
 *
 * Handles sending email notifications for ride events using Nodemailer.
 * Supports ride confirmations, reminders, and cancellations.
 */

import nodemailer from 'nodemailer';
import { logger } from 'firebase-functions/v2';

// Configure email transporter
// NOTE: For production, use environment variables for credentials
// You can use Gmail, SendGrid, or any SMTP service
const createTransporter = () => {
  // For development/testing, you can use Gmail with App Password
  // For production, use a proper email service like SendGrid
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  });
};

/**
 * Send ride confirmation email to rider
 * @param {Object} emailData - Email information
 * @param {string} emailData.riderEmail - Rider's email address
 * @param {string} emailData.riderName - Rider's name
 * @param {string} emailData.driverName - Driver's name
 * @param {string} emailData.pickup - Pickup location
 * @param {string} emailData.destination - Destination
 * @param {string} emailData.date - Ride date
 * @param {string} emailData.time - Ride time
 * @param {number} emailData.cost - Cost per seat
 * @param {number} emailData.seatsBooked - Number of seats booked
 */
export const sendRideConfirmationEmail = async (emailData) => {
  try {
    const {
      riderEmail,
      riderName,
      driverName,
      pickup,
      destination,
      date,
      time,
      cost,
      seatsBooked = 1
    } = emailData;

    const transporter = createTransporter();

    const mailOptions = {
      from: `"University Carpooling" <${process.env.EMAIL_USER || 'noreply@carpooling.com'}>`,
      to: riderEmail,
      subject: '🚗 Ride Confirmed - University Carpooling',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f8fafc;
              padding: 30px;
              border: 1px solid #e2e8f0;
            }
            .detail-box {
              background: white;
              padding: 20px;
              margin: 15px 0;
              border-radius: 8px;
              border-left: 4px solid #06b6d4;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #64748b;
            }
            .value {
              color: #0f172a;
              font-weight: 500;
            }
            .footer {
              background: #1e293b;
              color: #cbd5e1;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 14px;
            }
            .highlight {
              background: #dbeafe;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Ride Confirmed!</h1>
            <p>Your seat has been successfully booked</p>
          </div>

          <div class="content">
            <p>Hi <strong>${riderName}</strong>,</p>
            <p>Great news! Your ride has been confirmed with <strong>${driverName}</strong>.</p>

            <div class="detail-box">
              <h3 style="margin-top: 0; color: #0f172a;">📍 Ride Details</h3>

              <div class="detail-row">
                <span class="label">From:</span>
                <span class="value">${pickup}</span>
              </div>

              <div class="detail-row">
                <span class="label">To:</span>
                <span class="value">${destination}</span>
              </div>

              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${date}</span>
              </div>

              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${time}</span>
              </div>

              <div class="detail-row">
                <span class="label">Seats Booked:</span>
                <span class="value">${seatsBooked}</span>
              </div>

              <div class="detail-row">
                <span class="label">Total Cost:</span>
                <span class="value">$${(cost * seatsBooked).toFixed(2)}</span>
              </div>
            </div>

            <div class="highlight">
              <p style="margin: 0; font-weight: 600; color: #0369a1;">
                💡 You'll receive a reminder 30 minutes before departure
              </p>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Check the app for driver contact information</li>
              <li>Be ready at the pickup location 5 minutes early</li>
              <li>Have your payment ready if not paid online</li>
              <li>Don't forget to rate your ride after completion!</li>
            </ul>
          </div>

          <div class="footer">
            <p>University Carpooling - Safe, Affordable, Community-Driven</p>
            <p style="font-size: 12px; margin-top: 10px;">
              If you didn't book this ride, please contact support immediately.
            </p>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Confirmation email sent to ${riderEmail}`);

    return { success: true, message: 'Confirmation email sent' };
  } catch (error) {
    logger.error('Error sending confirmation email:', error);
    throw new Error('Failed to send confirmation email');
  }
};

/**
 * Send ride reminder email (30 minutes before departure)
 * @param {Object} emailData - Email information
 */
export const sendRideReminderEmail = async (emailData) => {
  try {
    const {
      userEmail,
      userName,
      userRole, // 'driver' or 'rider'
      otherPartyName, // driver name (if rider) or passenger names (if driver)
      pickup,
      destination,
      date,
      time
    } = emailData;

    const transporter = createTransporter();

    const isDriver = userRole === 'driver';
    const subject = isDriver
      ? '⏰ Ride Reminder - Time to Pick Up Your Passengers!'
      : '⏰ Ride Reminder - Your Ride Starts Soon!';

    const mailOptions = {
      from: `"University Carpooling" <${process.env.EMAIL_USER || 'noreply@carpooling.com'}>`,
      to: userEmail,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #fef3c7;
              padding: 30px;
              border: 2px solid #fbbf24;
            }
            .alert-box {
              background: white;
              padding: 20px;
              margin: 15px 0;
              border-radius: 8px;
              border: 2px solid #f59e0b;
              text-align: center;
            }
            .footer {
              background: #1e293b;
              color: #cbd5e1;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⏰ Ride Reminder</h1>
            <p style="font-size: 20px; margin: 0;">Your ride starts in 30 minutes!</p>
          </div>

          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>

            <div class="alert-box">
              <h2 style="color: #ea580c; margin-top: 0;">🚗 Get Ready!</h2>
              <p style="font-size: 18px; margin: 10px 0;">
                Your ride from <strong>${pickup}</strong> to <strong>${destination}</strong>
              </p>
              <p style="font-size: 16px; color: #7c2d12;">
                Scheduled for: <strong>${date}</strong> at <strong>${time}</strong>
              </p>
            </div>

            ${isDriver ? `
              <p><strong>Passengers waiting for you:</strong></p>
              <p>${otherPartyName}</p>
              <p><strong>Driver Checklist:</strong></p>
              <ul>
                <li>Ensure your car is ready</li>
                <li>Check fuel level</li>
                <li>Review pickup points in the app</li>
                <li>Call passengers if running late</li>
              </ul>
            ` : `
              <p><strong>Your driver:</strong> ${otherPartyName}</p>
              <p><strong>Passenger Checklist:</strong></p>
              <ul>
                <li>Be at the pickup location 5 minutes early</li>
                <li>Have your payment ready</li>
                <li>Keep your phone charged</li>
                <li>Check the app for any updates</li>
              </ul>
            `}

            <p style="text-align: center; margin-top: 20px;">
              <strong>📱 Open the app for real-time updates and driver contact</strong>
            </p>
          </div>

          <div class="footer">
            <p>Safe travels! 🌟</p>
            <p style="font-size: 12px;">University Carpooling</p>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Reminder email sent to ${userEmail}`);

    return { success: true, message: 'Reminder email sent' };
  } catch (error) {
    logger.error('Error sending reminder email:', error);
    throw new Error('Failed to send reminder email');
  }
};

/**
 * Send ride cancellation email
 * @param {Object} emailData - Email information
 */
export const sendRideCancellationEmail = async (emailData) => {
  try {
    const {
      userEmail,
      userName,
      cancelledBy, // Name of person who cancelled
      pickup,
      destination,
      date,
      time,
      reason = 'No reason provided'
    } = emailData;

    const transporter = createTransporter();

    const mailOptions = {
      from: `"University Carpooling" <${process.env.EMAIL_USER || 'noreply@carpooling.com'}>`,
      to: userEmail,
      subject: '❌ Ride Cancelled - University Carpooling',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #fef2f2;
              padding: 30px;
              border: 2px solid #fca5a5;
            }
            .detail-box {
              background: white;
              padding: 20px;
              margin: 15px 0;
              border-radius: 8px;
              border-left: 4px solid #dc2626;
            }
            .footer {
              background: #1e293b;
              color: #cbd5e1;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
            }
            .cta-button {
              display: inline-block;
              background: #06b6d4;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>❌ Ride Cancelled</h1>
            <p>Unfortunately, your ride has been cancelled</p>
          </div>

          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>We're sorry to inform you that your ride has been cancelled by <strong>${cancelledBy}</strong>.</p>

            <div class="detail-box">
              <h3 style="margin-top: 0; color: #7f1d1d;">Cancelled Ride Details</h3>
              <p><strong>From:</strong> ${pickup}</p>
              <p><strong>To:</strong> ${destination}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
              ${reason !== 'No reason provided' ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>

            <p><strong>What's next?</strong></p>
            <ul>
              <li>No charges will be applied for this cancellation</li>
              <li>Browse available rides to find an alternative</li>
              <li>Contact support if you have any questions</li>
            </ul>

            <div style="text-align: center;">
              <p>Don't worry! There are plenty of other rides available.</p>
            </div>
          </div>

          <div class="footer">
            <p>We're here to help!</p>
            <p style="font-size: 12px;">University Carpooling Support</p>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Cancellation email sent to ${userEmail}`);

    return { success: true, message: 'Cancellation email sent' };
  } catch (error) {
    logger.error('Error sending cancellation email:', error);
    throw new Error('Failed to send cancellation email');
  }
};

/**
 * Send email to driver when a new passenger joins
 * @param {Object} emailData - Email information
 */
export const sendNewPassengerEmail = async (emailData) => {
  try {
    const {
      driverEmail,
      driverName,
      riderName,
      pickup,
      destination,
      date,
      time,
      seatsRemaining
    } = emailData;

    const transporter = createTransporter();

    const mailOptions = {
      from: `"University Carpooling" <${process.env.EMAIL_USER || 'noreply@carpooling.com'}>`,
      to: driverEmail,
      subject: '🎉 New Passenger Joined Your Ride!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f0fdf4;
              padding: 30px;
              border: 1px solid #86efac;
            }
            .footer {
              background: #1e293b;
              color: #cbd5e1;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 New Passenger!</h1>
          </div>

          <div class="content">
            <p>Hi <strong>${driverName}</strong>,</p>
            <p>Good news! <strong>${riderName}</strong> has joined your ride.</p>

            <p><strong>Ride Details:</strong></p>
            <p>📍 ${pickup} → ${destination}</p>
            <p>📅 ${date} at ${time}</p>
            <p>💺 Seats Remaining: <strong>${seatsRemaining}</strong></p>

            <p>Check the app for passenger contact information and updates.</p>
          </div>

          <div class="footer">
            <p>Happy Carpooling! 🚗</p>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`New passenger notification sent to ${driverEmail}`);

    return { success: true, message: 'New passenger email sent' };
  } catch (error) {
    logger.error('Error sending new passenger email:', error);
    throw new Error('Failed to send new passenger email');
  }
};

export default {
  sendRideConfirmationEmail,
  sendRideReminderEmail,
  sendRideCancellationEmail,
  sendNewPassengerEmail
};