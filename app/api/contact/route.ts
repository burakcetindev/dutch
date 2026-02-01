import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, topic, message } = body;

    // Validate required fields
    if (!name || !email || !topic || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Here you can integrate with an email service like:
    // - SendGrid
    // - Resend
    // - AWS SES
    // - Nodemailer with SMTP
    
    // For now, we'll log the message (in production, replace this with actual email sending)
    console.log("📧 New contact form submission:");
    console.log(`From: ${name} (${email})`);
    console.log(`Topic: ${topic}`);
    console.log(`Message: ${message}`);
    console.log("---");

    // Simulate email sending
    // In production, add your email service here:
    /*
    await sendEmail({
      to: "burakcetindev@gmail.com",
      from: email,
      subject: `Dutch Vocab Contact: ${topic}`,
      text: `From: ${name} (${email})\n\nTopic: ${topic}\n\nMessage:\n${message}`,
    });
    */

    return NextResponse.json(
      { 
        success: true, 
        message: "Message received successfully" 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
