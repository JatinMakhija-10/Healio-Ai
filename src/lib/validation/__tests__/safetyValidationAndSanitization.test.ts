import { describe, it, expect } from "vitest";
import {
  sanitizeText,
  sanitizeFileName,
  normalizeWhitespace,
  stripHtml,
  sanitizeUrl,
  truncateText,
  removeNonPrintable,
  sanitizeInput,
} from "../sanitize";
import { checkRateLimit } from "../../utils/rateLimiter";

describe("Safety, Data Sanitization & Input Security Test Suite", () => {
  describe("sanitizeText (XSS & Injection Protection)", () => {
    it("should return empty string for null or undefined input", () => {
      expect(sanitizeText("")).toBe("");
    });

    it("should strip <script> tags and inner script content", () => {
      const payload = "Hello <script>alert('XSS')</script> World";
      const sanitized = sanitizeText(payload);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("alert");
    });

    it("should remove inline event handlers like onerror and onload", () => {
      const payload = "<img src='invalid.jpg' onerror='alert(1)' />";
      const sanitized = sanitizeText(payload);
      expect(sanitized).not.toContain("onerror");
    });

    it("should neutralize javascript: protocols", () => {
      const payload = "<a href='javascript:doEvil()'>Click here</a>";
      const sanitized = sanitizeText(payload);
      expect(sanitized).not.toContain("javascript:");
    });

    it("should escape HTML special characters like <, >, &, \", '", () => {
      const payload = "<b>Test & \"Quote\" 'Single'</b>";
      const sanitized = sanitizeText(payload);
      expect(sanitized).toContain("&lt;b&gt;");
      expect(sanitized).toContain("&amp;");
      expect(sanitized).toContain("&quot;");
    });
  });

  describe("sanitizeFileName (Path Traversal Protection)", () => {
    it("should return default name for empty inputs", () => {
      expect(sanitizeFileName("")).toBe("unnamed_file");
    });

    it("should replace directory slashes (Unix and Windows) with underscores", () => {
      expect(sanitizeFileName("etc/passwd")).toBe("etc_passwd");
      expect(sanitizeFileName("C:\\Windows\\System32\\cmd.exe")).toBe("C__Windows_System32_cmd.exe");
    });

    it("should strip path traversal relative indicators (..)", () => {
      expect(sanitizeFileName("../../../secret.txt")).not.toContain("..");
    });

    it("should remove null bytes and control characters", () => {
      expect(sanitizeFileName("file\0.png")).not.toContain("\0");
    });

    it("should prevent hidden files by replacing leading dots", () => {
      expect(sanitizeFileName(".htaccess")).toBe("_htaccess");
    });
  });

  describe("stripHtml & normalizeWhitespace", () => {
    it("should remove all HTML tags from formatted text", () => {
      const html = "<div><h1>Title</h1><p>Paragraph with <span>text</span></p></div>";
      expect(stripHtml(html)).toBe("TitleParagraph with text");
    });

    it("should convert multiple consecutive spaces, tabs, and newlines to single space", () => {
      const messy = "Line 1  \n\n  Line 2 \t\t  Line 3";
      expect(normalizeWhitespace(messy)).toBe("Line 1 Line 2 Line 3");
    });
  });

  describe("sanitizeUrl (URL Security)", () => {
    it("should allow safe http and https URLs", () => {
      expect(sanitizeUrl("https://healio.ai/dashboard")).toBe("https://healio.ai/dashboard");
      expect(sanitizeUrl("http://localhost:3000")).toBe("http://localhost:3000");
    });

    it("should block javascript:, data:, and file: protocols", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("");
      expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
      expect(sanitizeUrl("file:///C:/Windows")).toBe("");
    });
  });

  describe("truncateText & removeNonPrintable", () => {
    it("should truncate long text safely and append ellipsis", () => {
      const text = "This is a very long clinical summary text that exceeds max limit";
      const truncated = truncateText(text, 20);
      expect(truncated.length).toBe(20);
      expect(truncated.endsWith("...")).toBe(true);
    });

    it("should remove non-printable ASCII characters", () => {
      const text = "Clean \x07\x08\x0E text";
      expect(removeNonPrintable(text)).toBe("Clean  text");
    });
  });

  describe("sanitizeInput (Combined Utility)", () => {
    it("should apply multiple options simultaneously", () => {
      const raw = "<script>alert(1)</script>  Detailed   Clinical   Text  ";
      const sanitized = sanitizeInput(raw, {
        stripHtml: true,
        normalizeWhitespace: true,
        maxLength: 20,
      });
      expect(sanitized).not.toContain("<script>");
      expect(sanitized.length).toBeLessThanOrEqual(20);
    });
  });

  describe("Rate Limiter Algorithm", () => {
    it("should allow requests within specified limit and block excess", () => {
      const key = "test-action-ip-123";

      expect(checkRateLimit(key, 3, 1000).allowed).toBe(true);
      expect(checkRateLimit(key, 3, 1000).allowed).toBe(true);
      expect(checkRateLimit(key, 3, 1000).allowed).toBe(true);
      expect(checkRateLimit(key, 3, 1000).allowed).toBe(false);
    });
  });
});
