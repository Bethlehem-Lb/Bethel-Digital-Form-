<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bethle Digital Form</title>
  
  <!-- PWA Meta Tags for Installable App -->
  <meta name="theme-color" content="#2e7d32">
  <link rel="manifest" href="manifest.json">
  
  <!-- Libraries for PDF Export -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>
  
  <style>
    :root {
      --primary-green: #2e7d32;
      --dark-green: #1b5e20;
      --accent-green: #81c784;
      --bg-color: #f4f6f8;
      --card-bg: #ffffff;
      --text-dark: #2c3e50;
      --text-muted: #7f8c8d;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-dark);
      padding: 20px;
    }

    .container {
      max-width: 650px;
      margin: 0 auto;
    }

    /* Green Header Card with Page Fold */
    .header-card {
      position: relative;
      background: linear-gradient(135deg, var(--primary-green), var(--dark-green));
      color: white;
      padding: 24px;
      border-radius: 12px 0 12px 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      margin-bottom: 24px;
      overflow: hidden;
    }

    .header-card::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 32px 32px 0;
      border-color: transparent #e0e0e0 transparent transparent;
      box-shadow: -2px 2px 5px rgba(0,0,0,0.2);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-title h1 {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .header-subtitle {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.75);
      margin-top: 2px;
      font-style: italic;
    }

    .btn-create {
      background-color: #3b82f6;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
    }

    /* Cards */
    .card {
      background: var(--card-bg);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }

    /* Image 2 Request: Answers BOLD, Question Normal */
    .response-group {
      margin-bottom: 16px;
    }

    .question-label-normal {
      font-size: 15px;
      font-weight: 400; /* Regular weight for question */
      color: #4b5563;
      margin-bottom: 2px;
    }

    .answer-value-bold {
      font-size: 16px;
      font-weight: 700; /* Bold weight for answer */
      color: #111827;
    }

    /* Form Fields & Controls */
    .sector-item {
      border: 1px solid #e5e7eb;
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 12px;
      background-color: #fafafa;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      margin-top: 6px;
      margin-bottom: 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
    }

    .trigger-container {
      display: flex;
      align-items: center;
      gap: 10px;
      background-color: #f3f4f6;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
    }

    .trigger-select {
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #ccc;
    }

    .action-btn {
      width: 100%;
      padding: 12px;
      background-color: var(--primary-green);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 10px;
    }

    .hidden {
      display: none;
    }

    .action-links a {
      color: #2563eb;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      margin-left: 8px;
    }
  </style>
</head>
<body>

<div class="container">
  <div class="header-card" id="main-header">
    <div class="header-top">
      <div class="header-title">
        <h1>Your forms</h1>
        <div class="header-subtitle">Bethle Digital Form</div>
      </div>
      <button class="btn-create" onclick="showFormBuilder()">+ Create form</button>
    </div>
  </div>

  <div id="main-content"></div>
</div>

<script src="app.js"></script>
</body>
</html>
