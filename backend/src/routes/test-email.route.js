import express from 'express';
import resend from '../config/email.js';

const router = express.Router();

router.get('/', async (req, res) => {
    console.log("GET /api/v1/orders WAS CALLED");
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'royaldynastyfragrances@gmail.com',
      subject: 'Royal Dynasty Email Test',
      text: 'Your Royal Dynasty email system is working successfully!'
    });

    if (error) {
      console.error('RESEND ERROR:', error);

      return res.status(500).json({
        message: 'Failed to send test email',
        error: error.message
      });
    }

    res.status(200).json({
      message: 'Test email sent successfully',
      emailId: data.id
    });

  } catch (error) {
    console.error('EMAIL ERROR:', error);

    res.status(500).json({
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

export default router;