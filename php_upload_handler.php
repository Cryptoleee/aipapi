<?php
/**
 * PHP Upload Script for AiPapi React Frontend
 * Place this file in the root of your WordPress installation or theme folder.
 * URL should match the one in your App.jsx fetch call (e.g., https://www.aipostershop.nl/contact-upload.php)
 */

// 1. ALLOW CROSS-ORIGIN REQUESTS (CORS)
header("Access-Control-Allow-Origin: *"); // For production, replace * with your specific domain if needed
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. CHECK IF REQUEST IS POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

// 3. GET FORM DATA
$name = isset($_POST['name']) ? htmlspecialchars($_POST['name']) : 'Onbekend';
$email = isset($_POST['email']) ? filter_var($_POST['email'], FILTER_SANITIZE_EMAIL) : '';
$message = isset($_POST['message']) ? htmlspecialchars($_POST['message']) : '';

// 4. CONFIGURATION
$to = "info@wijzijnwolf.nl"; // YOUR EMAIL ADDRESS
$subject = "Nieuwe Commissie Aanvraag van " . $name;
$boundary = md5(time()); // Unique boundary for multipart email

// 5. HEADERS FOR HTML EMAIL WITH ATTACHMENT
$headers = "From: AiPapi Website <noreply@aipostershop.nl>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";

// 6. BUILD EMAIL BODY
// Text Part
$body = "--$boundary\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";

$email_content = "
<h2>Nieuwe Commissie Aanvraag</h2>
<p><strong>Naam:</strong> $name</p>
<p><strong>Email:</strong> $email</p>
<p><strong>Bericht:</strong><br>$message</p>
<hr>
<p><small>Verzonden via AiPapi React App</small></p>
";

$body .= $email_content . "\r\n";

// 7. HANDLE FILE ATTACHMENT
if (isset($_FILES['file']) && $_FILES['file']['error'] == UPLOAD_ERR_OK) {
    $file_tmp_name = $_FILES['file']['tmp_name'];
    $file_name = $_FILES['file']['name'];
    $file_size = $_FILES['file']['size'];
    $file_type = $_FILES['file']['type'];
    
    // Read the file content
    $handle = fopen($file_tmp_name, "r");
    $content = fread($handle, $file_size);
    fclose($handle);
    
    // Encode file content
    $encoded_content = chunk_split(base64_encode($content));
    
    // Attachment Part
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: $file_type; name=\"$file_name\"\r\n";
    $body .= "Content-Disposition: attachment; filename=\"$file_name\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= $encoded_content . "\r\n";
}

$body .= "--$boundary--";

// 8. SEND EMAIL
if (mail($to, $subject, $body, $headers)) {
    echo json_encode(["status" => "success", "message" => "Email sent successfully"]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to send email"]);
}
?>
