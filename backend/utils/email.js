import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporters = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.email_user,
    pass: process.env.email_pass,
  },
});

const sendbookingemail = async (userEmail, username, eventtitle) => {
  try {
    const mailoptions = {
      from: process.env.email_user,
      to: userEmail,
      subject: 'Eventigo booking confirmation',
      html: `
        <h2>Hi ${username}</h2>
        <p>Your booking for event <strong>${eventtitle}</strong> has been confirmed.</p>
        <p>Thank you for choosing Eventigo.</p>
      `,
    };

    await transporters.sendMail(mailoptions);
    console.log(`Booking confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send booking confirmation email to ${userEmail}:`, error);
  }
};

const sendotpemail = async (userEmail, otp, type) => {
  try {
    const title = type === 'account_verification' ? 'verify your eventigo account' : 'eventigo booking verification';
    const msg = type === 'account_verification'
      ? 'please use the following otp to verify your new eventigo account'
      : 'please use the following otp to complete your event booking';

    const mailoptions = {
      from: process.env.email_user,
      to: userEmail,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #333;">
          <h2 style="color: #4f46e5;">${title}</h2>
          <p style="color: #374151; font-size: 16px;">${msg}</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #111827;">${otp}</p>
        </div>
        <div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporters.sendMail(mailoptions);
    console.log(`OTP email sent to ${userEmail} for ${type}`);
  } catch (error) {
    console.error(`Failed to send OTP email to ${userEmail} for ${type}:`, error);
  }
};

export { sendbookingemail, sendotpemail };