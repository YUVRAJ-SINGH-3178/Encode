import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Upload,
  X,
  Loader,
  AlertCircle,
  CheckCircle,
  ScanLine,
  Smartphone,
  Image,
  Hash,
  Sparkles,
  Package,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

const BarcodeScanner = ({ onIngredientsFound, onClose, isLoading }) => {
  const [mode, setMode] = useState("select"); // select, camera, processing, result
  const [error, setError] = useState("");
  const [productInfo, setProductInfo] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [scanStatus, setScanStatus] = useState("");

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);

  const stopScanning = useCallback(() => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (e) {
        console.log("Reset error:", e);
      }
      codeReaderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.log("Track stop error:", e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setScanStatus("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const lookupBarcode = useCallback(async (barcode) => {
    setMode("processing");
    setError("");
    setScanStatus(`Looking up product: ${barcode}...`);

    try {
      // Use Open Food Facts API
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;

        // Extract ingredients - try multiple fields
        let ingredients =
          product.ingredients_text ||
          product.ingredients_text_en ||
          product.ingredients_text_with_allergens ||
          product.ingredients_text_debug ||
          "";

        // Clean up ingredients text
        ingredients = ingredients.replace(/_/g, "").replace(/\s+/g, " ").trim();

        if (!ingredients) {
          setError(
            `Product found: "${
              product.product_name || "Unknown"
            }" but no ingredients listed in the database. Try entering ingredients manually.`
          );
          setMode("select");
          return;
        }

        setProductInfo({
          name: product.product_name || "Unknown Product",
          brand: product.brands || "",
          ingredients: ingredients,
          image: product.image_front_small_url || product.image_url || null,
          barcode: barcode,
        });
        setMode("result");
      } else {
        setError(
          `Product not found for barcode: ${barcode}. This product may not be in the Open Food Facts database. Try a different product or enter ingredients manually.`
        );
        setMode("select");
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setError(
        "Failed to lookup product. Please check your internet connection and try again."
      );
      setMode("select");
    }
  }, []);

  const startCamera = async () => {
    setError("");
    setMode("camera");
    setScanStatus("Initializing camera...");

    try {
      // Create barcode reader instance
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Get available video devices
      const videoInputDevices = await codeReader.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        throw new Error("No camera found on this device");
      }

      // Prefer back camera
      let selectedDeviceId = videoInputDevices[0].deviceId;
      for (const device of videoInputDevices) {
        if (
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment")
        ) {
          selectedDeviceId = device.deviceId;
          break;
        }
      }

      setIsScanning(true);
      setScanStatus("Point camera at barcode...");

      // Start continuous scanning
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        async (result, err) => {
          if (result) {
            const barcodeValue = result.getText();
            console.log("Barcode detected:", barcodeValue);
            setScanStatus(`Found: ${barcodeValue}`);
            stopScanning();
            await lookupBarcode(barcodeValue);
          }
          if (err && !(err instanceof NotFoundException)) {
            // Only log real errors, not "not found" which happens every frame
            if (
              err.message &&
              !err.message.includes("No MultiFormat Readers")
            ) {
              console.error("Scan error:", err);
            }
          }
        }
      );

      // Store stream reference for cleanup
      if (videoRef.current && videoRef.current.srcObject) {
        streamRef.current = videoRef.current.srcObject;
      }
    } catch (err) {
      console.error("Camera error:", err);
      stopScanning();
      setError(
        err.message ||
          "Could not access camera. Please check permissions or try uploading an image."
      );
      setMode("select");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setMode("processing");
    setScanStatus("Processing image...");

    try {
      const codeReader = new BrowserMultiFormatReader();

      // Create image URL
      const imageUrl = URL.createObjectURL(file);

      try {
        const result = await codeReader.decodeFromImageUrl(imageUrl);
        const barcodeValue = result.getText();
        console.log("Barcode from image:", barcodeValue);
        await lookupBarcode(barcodeValue);
      } catch (decodeErr) {
        console.error("Decode error:", decodeErr);
        setError(
          "No barcode detected in the image. Try a clearer photo with good lighting, or enter the barcode manually."
        );
        setMode("select");
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to process image. Please try again.");
      setMode("select");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleManualLookup = async (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;

    await lookupBarcode(manualBarcode.trim());
  };

  const handleUseIngredients = () => {
    if (productInfo?.ingredients) {
      onIngredientsFound(productInfo.ingredients);
    }
  };

  const handleBack = () => {
    stopScanning();
    setError("");
    setProductInfo(null);
    setManualBarcode("");
    setMode("select");
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <div
      className="paper-surface fade-in"
      style={{ padding: "0", overflow: "hidden" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.25rem 1.5rem",
          background:
            "linear-gradient(135deg, var(--color-accent-soft) 0%, var(--color-accent-light) 100%)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(107, 123, 58, 0.3)",
            }}
          >
            <ScanLine size={20} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
              Barcode Scanner
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
              }}
            >
              Scan to get ingredients
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="btn-ghost"
          style={{
            padding: "0.5rem",
            borderRadius: "50%",
            background: "var(--color-paper)",
          }}
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: "1.5rem" }}>
        {/* Error display */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "1rem",
              background:
                "linear-gradient(135deg, var(--color-low-bg) 0%, #faf5f3 100%)",
              borderRadius: "12px",
              marginBottom: "1.25rem",
              fontSize: "0.875rem",
              color: "var(--color-low)",
              border: "1px solid rgba(122, 107, 138, 0.2)",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--color-low)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertCircle size={16} color="white" />
            </div>
            <span style={{ paddingTop: "0.35rem" }}>{error}</span>
          </div>
        )}

        {/* Mode: Select */}
        {mode === "select" && (
          <div className="fade-in">
            {/* Option Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              {/* Camera Option */}
              <button
                onClick={startCamera}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "1.5rem 1rem",
                  background:
                    "linear-gradient(135deg, var(--color-accent-soft) 0%, var(--color-paper) 100%)",
                  border: "2px solid var(--color-accent)",
                  borderRadius: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                className="scanner-option-card"
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background:
                      "linear-gradient(135deg, var(--color-accent) 0%, #7d8f45 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 20px rgba(107, 123, 58, 0.25)",
                  }}
                >
                  <Camera size={28} color="white" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Use Camera
                  </p>
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Scan in real-time
                  </p>
                </div>
              </button>

              {/* Upload Option */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "1.5rem 1rem",
                  background: "var(--color-paper)",
                  border: "2px dashed var(--color-border)",
                  borderRadius: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                className="scanner-option-card"
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: "var(--color-bg-warm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <Image size={28} color="var(--color-text-secondary)" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Upload Image
                  </p>
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    From gallery
                  </p>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </div>

            {/* Manual barcode entry */}
            <div
              style={{
                background: "var(--color-bg-warm)",
                borderRadius: "12px",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <Hash size={16} color="var(--color-accent)" />
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Enter barcode manually
                </p>
              </div>
              <form
                onSubmit={handleManualLookup}
                style={{ display: "flex", gap: "0.5rem" }}
              >
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="e.g. 5000159407236"
                  style={{
                    flex: 1,
                    background: "var(--color-paper)",
                    borderRadius: "10px",
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!manualBarcode.trim()}
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>

            {/* Info text */}
            <p
              style={{
                marginTop: "1.25rem",
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
              }}
            >
              <Sparkles size={12} />
              Powered by Open Food Facts database
            </p>
          </div>
        )}

        {/* Mode: Camera */}
        {mode === "camera" && (
          <div className="fade-in">
            <div
              style={{
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
                background: "#000",
                marginBottom: "1rem",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  display: "block",
                  minHeight: "300px",
                  maxHeight: "400px",
                  objectFit: "cover",
                }}
              />

              {/* Corner brackets */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  className="scan-region"
                  style={{
                    width: "85%",
                    height: "28%",
                    position: "relative",
                  }}
                >
                  {/* Corner brackets */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "24px",
                      height: "24px",
                      borderTop: "4px solid var(--color-accent)",
                      borderLeft: "4px solid var(--color-accent)",
                      borderRadius: "4px 0 0 0",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "24px",
                      height: "24px",
                      borderTop: "4px solid var(--color-accent)",
                      borderRight: "4px solid var(--color-accent)",
                      borderRadius: "0 4px 0 0",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      width: "24px",
                      height: "24px",
                      borderBottom: "4px solid var(--color-accent)",
                      borderLeft: "4px solid var(--color-accent)",
                      borderRadius: "0 0 0 4px",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: "24px",
                      height: "24px",
                      borderBottom: "4px solid var(--color-accent)",
                      borderRight: "4px solid var(--color-accent)",
                      borderRadius: "0 0 4px 0",
                    }}
                  />
                </div>
              </div>

              {/* Dark overlay outside scan area */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.6) 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Scan line animation */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  className="scan-line"
                  style={{
                    width: "80%",
                    height: "3px",
                    background:
                      "linear-gradient(90deg, transparent 0%, var(--color-accent) 20%, var(--color-accent) 80%, transparent 100%)",
                    boxShadow:
                      "0 0 15px var(--color-accent), 0 0 30px var(--color-accent)",
                  }}
                />
              </div>

              {/* Status indicator */}
              <div
                style={{
                  position: "absolute",
                  bottom: "1.25rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(255,255,255,0.95)",
                  color: "var(--color-text-primary)",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "999px",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                }}
              >
                {isScanning && (
                  <Loader
                    size={16}
                    color="var(--color-accent)"
                    className="spin"
                  />
                )}
                {scanStatus || "Scanning..."}
              </div>
            </div>

            <button
              onClick={handleBack}
              className="btn-secondary"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <X size={16} />
              Cancel Scanning
            </button>

            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                textAlign: "center",
                marginTop: "1rem",
                lineHeight: 1.5,
              }}
            >
              📱 Hold steady • 💡 Good lighting • 🎯 Center the barcode
            </p>
          </div>
        )}

        {/* Mode: Processing */}
        {mode === "processing" && (
          <div
            className="fade-in"
            style={{ textAlign: "center", padding: "3rem 1.5rem" }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                margin: "0 auto 1.5rem",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--color-accent-soft) 0%, var(--color-accent-light) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                className="processing-ring"
                style={{
                  position: "absolute",
                  inset: "-4px",
                  borderRadius: "50%",
                  border: "3px solid transparent",
                  borderTopColor: "var(--color-accent)",
                }}
              />
              <Package size={32} color="var(--color-accent)" />
            </div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem" }}>
              Looking up product
            </h3>
            <p
              style={{
                margin: 0,
                color: "var(--color-text-muted)",
                fontSize: "0.875rem",
              }}
            >
              {scanStatus || "Searching the database..."}
            </p>
          </div>
        )}

        {/* Mode: Result */}
        {mode === "result" && productInfo && (
          <div className="fade-in">
            {/* Success banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                background:
                  "linear-gradient(135deg, var(--color-high-bg) 0%, #f0f5eb 100%)",
                borderRadius: "10px",
                marginBottom: "1rem",
                border: "1px solid rgba(107, 123, 58, 0.2)",
              }}
            >
              <CheckCircle size={20} color="var(--color-high)" />
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-high)",
                }}
              >
                Product found successfully!
              </span>
            </div>

            {/* Product card */}
            <div
              style={{
                background: "var(--color-paper)",
                borderRadius: "16px",
                padding: "1.25rem",
                marginBottom: "1rem",
                border: "1px solid var(--color-divider)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid var(--color-divider)",
                }}
              >
                {productInfo.image ? (
                  <img
                    src={productInfo.image}
                    alt={productInfo.name}
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "contain",
                      borderRadius: "12px",
                      background: "var(--color-bg-warm)",
                      padding: "0.5rem",
                      border: "1px solid var(--color-divider)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "12px",
                      background: "var(--color-bg-warm)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--color-divider)",
                    }}
                  >
                    <Package size={32} color="var(--color-text-muted)" />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      margin: "0 0 0.35rem",
                      fontSize: "1.15rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {productInfo.name}
                  </h3>
                  {productInfo.brand && (
                    <p
                      style={{
                        margin: "0 0 0.5rem",
                        fontSize: "0.875rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {productInfo.brand}
                    </p>
                  )}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.25rem 0.6rem",
                      background: "var(--color-bg-warm)",
                      borderRadius: "6px",
                      fontSize: "0.7rem",
                      color: "var(--color-text-muted)",
                      fontFamily: "monospace",
                    }}
                  >
                    <Hash size={10} />
                    {productInfo.barcode}
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.6rem",
                  }}
                >
                  <Sparkles size={14} color="var(--color-accent)" />
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-accent)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Ingredients
                  </p>
                </div>
                <div
                  style={{
                    background: "var(--color-bg-warm)",
                    borderRadius: "10px",
                    padding: "1rem",
                    maxHeight: "140px",
                    overflow: "auto",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "var(--color-text-secondary)",
                      lineHeight: 1.6,
                    }}
                  >
                    {productInfo.ingredients}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={handleBack}
                className="btn-secondary"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <RotateCcw size={16} />
                Scan Again
              </button>
              <button
                onClick={handleUseIngredients}
                className="btn-primary"
                style={{
                  flex: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader size={16} className="spin" /> Processing...
                  </>
                ) : (
                  <>
                    Analyze Ingredients <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
        
        .scan-line {
          animation: scanLine 2.5s ease-in-out infinite;
        }
        
        @keyframes scanLine {
          0%, 100% { 
            transform: translateY(-60px);
            opacity: 0.6;
          }
          50% { 
            transform: translateY(60px);
            opacity: 1;
          }
        }
        
        .scan-region {
          animation: pulse-corners 2s ease-in-out infinite;
        }
        
        @keyframes pulse-corners {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .processing-ring {
          animation: spin 1s linear infinite;
        }
        
        .scanner-option-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        
        .scanner-option-card:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
