# 🎓 Student Result Management System

A web-based application for managing student results with role-based access control for Admins and Teachers. Built using **React** and **Firebase (BaaS)**.

---

## 🚀 Features

### 🔐 Role-Based Access Control

- **Admin**
  - Add students manually or upload CSV for bulk entry
  - Add and assign teachers with login credentials
  - Manage class-section combinations
- **Teacher**
  - View assigned students based on class-section
  - Add exam results per student
- **Student**
  - Check their results using **Exam Name** and **Registration Number**
  - Download marklist as PDF using `jsPDF`

---

## 📚 Tech Stack

- **Frontend:** React, TailwindCSS, Lucide Icons
- **Backend-as-a-Service:** Firebase (Firestore, Auth, Storage)
- **CSV Parsing:** react-papaparse
- **PDF Generation:** jsPDF

---

## 🛠️ Installation & Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/muhammedajmalkt/school-result-mgt/.git

