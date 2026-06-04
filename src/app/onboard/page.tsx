"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function OnboardPage() {
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        entityType: "Proprietorship",
        gstin: "",
        pan: "",
        tan: "",
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
        gDriveLink: "",

        itxLogin: "", itxPassword: "",
        gstLogin: "", gstPassword: "",
        tracesLogin: "", tracesPassword: "",
        pfLogin: "", pfPassword: "",
        esiLogin: "", esiPassword: "",
        ptLogin: "", ptPassword: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/onboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Failed to submit form");
                console.error(data);
                return;
            }

            setSubmitted(true);
            toast.success("Details submitted successfully!");
        } catch (error) {
            toast.error("An error occurred. Please try again.");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)", padding: "20px" }}>
                <div style={{ background: "var(--surface)", padding: "40px", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "center", maxWidth: "500px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "20px" }}>✅</div>
                    <h2 style={{ color: "var(--ca-saffron)", marginBottom: "15px" }}>Submission Successful!</h2>
                    <p style={{ color: "var(--muted)", lineHeight: "1.6" }}>
                        Thank you for providing your details. Your information has been securely stored in our system. Our team will review the information and get back to you shortly.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "var(--background)", padding: "40px 20px" }}>
            <Toaster position="top-center" />
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h1 style={{ color: "var(--text)", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" }}>
                        KC Shah <span style={{ color: "var(--ca-saffron)" }}>& Associates</span>
                    </h1>
                    <p style={{ color: "var(--muted)", marginTop: "10px", fontSize: "15px" }}>
                        Secure Client Onboarding Portal
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    
                    {/* Section 1: Business Details */}
                    <div className="card" style={{ padding: "24px" }}>
                        <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "20px", color: "var(--ca-saffron)", fontSize: "16px" }}>
                            1. Business Details
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div className="field" style={{ gridColumn: "1 / -1" }}>
                                <label>Entity Name *</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Acme Corp Pvt Ltd" />
                            </div>
                            <div className="field">
                                <label>Entity Type *</label>
                                <select name="entityType" value={formData.entityType} onChange={handleChange}>
                                    <option value="Proprietorship">Proprietorship</option>
                                    <option value="Partnership">Partnership</option>
                                    <option value="LLP">LLP</option>
                                    <option value="Private Limited">Private Limited</option>
                                    <option value="Public Limited">Public Limited</option>
                                    <option value="HUF">HUF</option>
                                    <option value="Trust">Trust</option>
                                    <option value="Individual">Individual</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>PAN Number</label>
                                <input type="text" name="pan" value={formData.pan} onChange={handleChange} style={{ textTransform: "uppercase" }} />
                            </div>
                            <div className="field">
                                <label>GSTIN</label>
                                <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} style={{ textTransform: "uppercase" }} />
                            </div>
                            <div className="field">
                                <label>TAN Number</label>
                                <input type="text" name="tan" value={formData.tan} onChange={handleChange} style={{ textTransform: "uppercase" }} />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Contact Info */}
                    <div className="card" style={{ padding: "24px" }}>
                        <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "20px", color: "var(--ca-saffron)", fontSize: "16px" }}>
                            2. Primary Contact Information
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div className="field" style={{ gridColumn: "1 / -1" }}>
                                <label>Contact Person Name</label>
                                <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} />
                            </div>
                            <div className="field">
                                <label>Email Address</label>
                                <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} />
                            </div>
                            <div className="field">
                                <label>Phone / Mobile</label>
                                <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Document Repository */}
                    <div className="card" style={{ padding: "24px", border: "1px solid var(--ca-saffron)" }}>
                        <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "20px", color: "var(--ca-saffron)", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                            📁 3. Document Repository
                        </h3>
                        <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "16px" }}>
                            Please create a Google Drive folder containing your KYC documents (PAN, Aadhaar, GST Certificate, Incorporation Certificate, etc.) and paste the shareable link below.
                        </p>
                        <div className="field">
                            <label>Google Drive Folder Link</label>
                            <input type="url" name="gDriveLink" value={formData.gDriveLink} onChange={handleChange} placeholder="https://drive.google.com/drive/folders/..." />
                        </div>
                    </div>

                    {/* Section 4: Portal Credentials */}
                    <div className="card" style={{ padding: "24px" }}>
                        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ color: "var(--ca-saffron)", fontSize: "16px", margin: 0 }}>4. Portal Credentials</h3>
                            <span style={{ fontSize: "11px", background: "rgba(0, 207, 132, 0.1)", color: "#00CF84", padding: "4px 8px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                                🔒 AES-256 Encrypted
                            </span>
                        </div>
                        <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "24px" }}>
                            Your passwords are encrypted using bank-grade AES-256 encryption before being stored in our vault. Please provide credentials for the portals relevant to your services.
                        </p>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            {/* Income Tax */}
                            <div style={{ background: "var(--surface2)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                <h4 style={{ fontSize: "13px", marginBottom: "12px", color: "var(--text)" }}>Income Tax Portal</h4>
                                <div className="field" style={{ marginBottom: "10px" }}>
                                    <input type="text" name="itxLogin" value={formData.itxLogin} onChange={handleChange} placeholder="User ID / PAN" />
                                </div>
                                <div className="field" style={{ marginBottom: 0 }}>
                                    <input type="password" name="itxPassword" value={formData.itxPassword} onChange={handleChange} placeholder="Password" />
                                </div>
                            </div>
                            
                            {/* GST */}
                            <div style={{ background: "var(--surface2)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                <h4 style={{ fontSize: "13px", marginBottom: "12px", color: "var(--text)" }}>GST Portal</h4>
                                <div className="field" style={{ marginBottom: "10px" }}>
                                    <input type="text" name="gstLogin" value={formData.gstLogin} onChange={handleChange} placeholder="Username" />
                                </div>
                                <div className="field" style={{ marginBottom: 0 }}>
                                    <input type="password" name="gstPassword" value={formData.gstPassword} onChange={handleChange} placeholder="Password" />
                                </div>
                            </div>

                            {/* Traces */}
                            <div style={{ background: "var(--surface2)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                <h4 style={{ fontSize: "13px", marginBottom: "12px", color: "var(--text)" }}>Traces (TDS) Portal</h4>
                                <div className="field" style={{ marginBottom: "10px" }}>
                                    <input type="text" name="tracesLogin" value={formData.tracesLogin} onChange={handleChange} placeholder="User ID" />
                                </div>
                                <div className="field" style={{ marginBottom: 0 }}>
                                    <input type="password" name="tracesPassword" value={formData.tracesPassword} onChange={handleChange} placeholder="Password" />
                                </div>
                            </div>

                            {/* PF */}
                            <div style={{ background: "var(--surface2)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                <h4 style={{ fontSize: "13px", marginBottom: "12px", color: "var(--text)" }}>PF (EPFO) Portal</h4>
                                <div className="field" style={{ marginBottom: "10px" }}>
                                    <input type="text" name="pfLogin" value={formData.pfLogin} onChange={handleChange} placeholder="User ID" />
                                </div>
                                <div className="field" style={{ marginBottom: 0 }}>
                                    <input type="password" name="pfPassword" value={formData.pfPassword} onChange={handleChange} placeholder="Password" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                        <button type="submit" disabled={submitting} className="btn btn-p" style={{ fontSize: "15px", padding: "12px 30px" }}>
                            {submitting ? "Submitting securely..." : "Submit Details"}
                        </button>
                    </div>

                </form>
            </div>
            <style jsx global>{`
                .card {
                    background: var(--surface);
                    border-radius: 12px;
                    border: 1px solid var(--border);
                }
                .field label {
                    display: block;
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--muted);
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .field input, .field select {
                    width: 100%;
                    background: rgba(255,255,255,.03);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 10px 14px;
                    color: var(--text);
                    font-family: inherit;
                    font-size: 13px;
                    transition: border-color 0.2s;
                }
                .field input:focus, .field select:focus {
                    outline: none;
                    border-color: var(--ca-saffron);
                }
            `}</style>
        </div>
    );
}
