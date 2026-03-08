# Raja King

## Current State
A trending topics website called "Trending Hub" in English. It has a hero section, navbar with category filters, trending items list, admin panel for managing content, and fire-themed visuals.

## Requested Changes (Diff)

### Add
- Two package/investment panels section:
  - Package 1: Investment range 1,000 to 50,000 (PKR) with 1% profit percentage
  - Package 2: Investment range 1,00,000 to 3,00,000 (PKR) with 2% profit percentage
- Each package panel should show: name, investment range, profit percentage, and a visual display

### Modify
- Website name: "Trending Hub" → "Raja King" everywhere (navbar, hero, footer, page title)
- Website language: All visible text changed from English to Urdu
  - Navigation labels, category names, buttons, placeholders, section headers, empty states, admin panel labels all in Urdu
  - Hero tagline, footer text, admin form labels in Urdu
  - HTML lang attribute changed to "ur"
  - Add dir="rtl" for proper Urdu text rendering
- Logo alt text and aria-labels updated to "Raja King"

### Remove
- Nothing removed

## Implementation Plan
1. Update index.html: title to "Raja King", lang="ur", dir="rtl"
2. In App.tsx:
   - Replace all "Trending Hub" text with "راجہ کنگ"
   - Translate all UI text to Urdu (category names, buttons, labels, placeholders, section headers, empty states, admin panel)
   - Add a PackagePanel component with two investment packages
   - Insert PackagePanel section between hero and trending list
   - Update image alt text and aria-labels
3. Package panel details:
   - Package 1 "بنیادی پیکیج": 1,000 to 50,000 PKR, 1% منافع
   - Package 2 "پریمیم پیکیج": 1,00,000 to 3,00,000 PKR, 2% منافع
