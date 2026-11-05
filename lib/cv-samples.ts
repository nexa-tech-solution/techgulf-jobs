import type { CvTemplate } from "@/lib/cv-latex";

/** Sample documents, one per template. Every person, company and contact detail here is made up. */
const SAMPLES: Record<CvTemplate, string> = {
  classic: String.raw`\documentclass{classic}
\accentcolor{1e3a5f}

\name{Omar Khalil}
\headline{IT Project Manager, PMP}
\email{omar.khalil@example.com}
\phone{+971 50 000 0001}
\location{Abu Dhabi, UAE}
\website{linkedin.com/in/example-omar}

\begin{document}

\section{Summary}
IT project manager with 11 years of experience delivering banking and government systems across the UAE and Jordan.

\section{Experience}
\entry{Senior IT Project Manager}{Example Bank}{01/2019 -- Present}{Abu Dhabi}
\begin{itemize}
  \item Led a core banking upgrade for 40 branches, on budget and two weeks early.
  \item Managed a portfolio of 9 projects worth AED 25M.
\end{itemize}
\entry{IT Project Manager}{Example Systems}{03/2014 -- 12/2018}{Amman}
\begin{itemize}
  \item Delivered e-services for 3 government clients.
\end{itemize}

\section{Education}
\entry{BSc Computer Engineering}{Example University}{2009 -- 2013}{}

\section{Certifications}
\entry{Project Management Professional (PMP)}{PMI}{2017}{}

\section{Languages}
Arabic (Native), English (Fluent)

\end{document}
`,
  modern: String.raw`\documentclass{modern}
\accentcolor{0f766e}

\name{Sara Haddad}
\headline{Senior Backend Engineer}
\email{sara.haddad@example.com}
\phone{+971 50 000 0002}
\location{Dubai, UAE}
\website{github.com/example-sara}

\begin{document}

\section{Summary}
Backend engineer with 6 years of experience building payment and delivery platforms in the Gulf.

\section{Experience}
\entry{Senior Backend Engineer}{Example Payments}{03/2022 -- Present}{Dubai}
\begin{itemize}
  \item Lead a team of 4 building payment APIs in \textbf{Go}.
  \item Reduced checkout errors by 30\% after moving core services to Kubernetes.
\end{itemize}
\entry{Backend Engineer}{Example Delivery}{06/2019 -- 02/2022}{Riyadh}
\begin{itemize}
  \item Built order tracking with Kafka and PostgreSQL across 4 countries.
\end{itemize}

\section{Education}
\entry{BSc Computer Science}{Example University}{2015 -- 2019}{}

\section{Skills}
\skills{Languages}{Go, Python, SQL}
\skills{Infrastructure}{AWS, Kubernetes, Terraform, Kafka}

\end{document}
`,
  compact: String.raw`\documentclass{compact}
\accentcolor{334155}

\name{Rahul Menon}
\headline{SAP FICO Consultant}
\email{rahul.menon@example.com}
\phone{+91 90000 00003}
\location{Bengaluru, India}

\begin{document}

\section{Summary}
SAP FICO consultant with 14 years of experience and 8 full-cycle implementations in India and the GCC.

\section{Experience}
\entry{Lead SAP FICO Consultant}{Example Consulting}{2020 -- Present}{Bengaluru}
\begin{itemize}
  \item Led an S/4HANA finance migration for a retail group with 12 legal entities.
  \item Configured VAT for the UAE and Saudi Arabia.
\end{itemize}
\entry{Senior SAP Consultant}{Example Technologies}{2015 -- 2020}{Dubai}
\begin{itemize}
  \item Delivered 3 rollouts for R\&D and manufacturing clients.
\end{itemize}
\entry{SAP Consultant}{Example Services}{2011 -- 2015}{Pune}
\begin{itemize}
  \item Supported GL, AP, AR and asset accounting for 2,000 users.
\end{itemize}

\section{Education}
\entry{MBA Finance}{Example Institute}{2009 -- 2011}{}

\section{Skills}
S/4HANA, FICO, Controlling, VAT, Fiori, ABAP basics

\end{document}
`,
  gulf: String.raw`\documentclass{gulf}
\accentcolor{0f766e}

\name{Fatima Rahman}
\headline{DevOps Engineer}
\email{fatima.rahman@example.com}
\phone{+971 50 000 0004}
\location{Dubai, UAE}
\website{linkedin.com/in/example-fatima}
\personal{Nationality}{Indian}
\personal{Visa status}{Employment visa, transferable}
\personal{Notice period}{30 days}

\begin{document}

\section{Summary}
DevOps engineer with 7 years of experience, including 4 in the UAE, running cloud platforms for retail and logistics.

\section{Experience}
\entry{DevOps Engineer}{Example Retail Group}{05/2022 -- Present}{Dubai}
\begin{itemize}
  \item Cut deployment time from 2 hours to 15 minutes with GitLab CI and Argo CD.
  \item Run 60 services on Amazon EKS across 2 regions.
\end{itemize}
\entry{Systems Engineer}{Example Infotech}{07/2018 -- 04/2022}{Kochi}
\begin{itemize}
  \item Automated server provisioning with Ansible and Terraform.
\end{itemize}

\section{Education}
\entry{BTech Information Technology}{Example College of Engineering}{2014 -- 2018}{}

\section{Skills}
AWS, Kubernetes, Terraform, Ansible, GitLab CI, Prometheus

\section{Languages}
English (Fluent), Hindi (Fluent), Malayalam (Native)

\end{document}
`,
  bilingual: String.raw`\documentclass{bilingual}
\accentcolor{166534}

\name{Abdullah Alharbi | عبدالله الحربي}
\headline{Data Analyst | محلل بيانات}
\email{abdullah@example.com}
\phone{+966 50 000 0005}
\location{Riyadh | الرياض}
\personal{Nationality | الجنسية}{Saudi | سعودي}

\begin{document}

\section{Summary | نبذة}
Data analyst with 5 years of experience in telecom and government reporting.

محلل بيانات بخبرة 5 سنوات في الاتصالات والتقارير الحكومية.

\section{Experience | الخبرة}
\entry{Data Analyst | محلل بيانات}{Example Telecom | شركة مثال للاتصالات}{2021 -- Present}{Riyadh}
\begin{itemize}
  \item Built Power BI dashboards used by 200 managers.
  \item بنيت لوحات معلومات يستخدمها 200 مدير.
\end{itemize}

\section{Education | التعليم}
\entry{BSc Information Systems | بكالوريوس نظم المعلومات}{Example University | جامعة مثال}{2016 -- 2020}{}

\section{Skills | المهارات}
SQL, Power BI, Python, Excel

\section{Languages | اللغات}
Arabic (Native), English (Fluent)

العربية (اللغة الأم)، الإنجليزية (بطلاقة)

\end{document}
`,
  executive: String.raw`\documentclass{executive}
\accentcolor{7c2d12}

\name{Layla Mansour}
\headline{Chief Technology Officer}
\email{layla.mansour@example.com}
\phone{+974 5000 0006}
\location{Doha, Qatar}
\website{linkedin.com/in/example-layla}

\begin{document}

\section{Executive summary}
Technology leader with 18 years of experience scaling engineering organisations in fintech and energy across the GCC.

\section{Key achievements}
\begin{itemize}
  \item Grew engineering from 30 to 180 people across 3 countries.
  \item Delivered a QAR 90M digital programme ahead of schedule.
\end{itemize}

\section{Experience}
\entry{Chief Technology Officer}{Example Fintech}{2020 -- Present}{Doha}
\begin{itemize}
  \item Own technology strategy, security and a team of 180.
  \item Prepared the platform for central bank licensing.
\end{itemize}
\entry{VP Engineering}{Example Energy}{2014 -- 2020}{Abu Dhabi}
\begin{itemize}
  \item Led the move of 120 applications to the cloud.
\end{itemize}

\section{Education}
\entry{MSc Software Engineering}{Example University}{2006 -- 2008}{}

\end{document}
`,
  engineer: String.raw`\documentclass{engineer}
\accentcolor{1d4ed8}

\name{Ananya Iyer}
\headline{Software Engineer (SDE-2)}
\email{ananya.iyer@example.com}
\phone{+91 90000 00007}
\location{Hyderabad, India}
\website{github.com/example-ananya}
\website{linkedin.com/in/example-ananya}

\begin{document}

\section{Skills}
\skills{Languages}{Java, TypeScript, Python, C++}
\skills{Frameworks}{Spring Boot, React, Node.js}
\skills{Systems}{AWS, Docker, Redis, Kafka, PostgreSQL}

\section{Experience}
\entry{Software Engineer 2}{Example Commerce}{07/2022 -- Present}{Hyderabad}
\begin{itemize}
  \item Scaled the checkout API to 12,000 requests per second with p99 under 120 ms.
  \item Reduced AWS costs by 22\% through caching and autoscaling.
\end{itemize}
\entry{Software Engineer}{Example Labs}{07/2020 -- 06/2022}{Bengaluru}
\begin{itemize}
  \item Built a React and Node.js admin portal used by 3,000 sellers.
\end{itemize}

\section{Projects}
\entry{Rate limiter library}{Java, Redis}{2023}{}
\begin{itemize}
  \item Open-source sliding window limiter, see \href{https://github.com/example-ananya/limiter}{GitHub}.
\end{itemize}

\section{Education}
\entry{BTech Computer Science}{Example Institute of Technology}{2016 -- 2020}{CGPA 8.7/10}

\end{document}
`,
  fresher: String.raw`\documentclass{fresher}
\accentcolor{0f172a}

\name{Vikram Nair}
\headline{Computer Science Graduate}
\email{vikram.nair@example.com}
\phone{+91 90000 00008}
\location{Chennai, India}
\website{github.com/example-vikram}

\begin{document}

\section{Objective}
Computer science graduate looking for a software developer role, with internship experience in Python and React.

\section{Education}
\entry{BTech Computer Science}{Example College of Engineering}{2022 -- 2026}{CGPA 8.4/10}

\section{Skills}
\skills{Languages}{Python, Java, JavaScript, SQL}
\skills{Tools}{React, Django, Git, Docker}

\section{Projects}
\entry{Campus placement portal}{React, Django, PostgreSQL}{2025}{}
\begin{itemize}
  \item Built a portal used by 800 students to track company drives.
\end{itemize}
\entry{Expense tracker}{Python, SQLite}{2024}{}
\begin{itemize}
  \item Added monthly reports and CSV import.
\end{itemize}

\section{Internships}
\entry{Software Intern}{Example Technologies}{05/2025 -- 07/2025}{Chennai}
\begin{itemize}
  \item Wrote REST APIs in Django and raised test coverage from 40\% to 75\%.
\end{itemize}

\section{Certifications}
\entry{AWS Cloud Practitioner}{Amazon}{2025}{}

\end{document}
`,
  minimal: String.raw`\documentclass{minimal}

\name{Hassan Ali}
\headline{Network Engineer}
\email{hassan.ali@example.com}
\phone{+965 5000 0009}
\location{Kuwait City, Kuwait}
\personal{Nationality}{Egyptian}
\personal{Visa status}{Transferable residency}

\begin{document}

\section{Summary}
Network engineer with 8 years of experience in enterprise and data centre networks. CCNP certified.

\section{Experience}
\entry{Network Engineer}{Example Telecom}{02/2020 -- Present}{Kuwait City}
\begin{itemize}
  \item Maintain 99.98\% availability across 150 sites.
  \item Led the SD-WAN migration for 40 branches.
\end{itemize}
\entry{Network Administrator}{Example Networks}{06/2016 -- 01/2020}{Cairo}
\begin{itemize}
  \item Managed Cisco routing, switching and firewalls.
\end{itemize}

\section{Education}
\entry{BSc Communications Engineering}{Example University}{2011 -- 2016}{}

\section{Certifications}
\entry{Cisco CCNP Enterprise}{Cisco}{2021}{}

\section{Skills}
Cisco, BGP, OSPF, SD-WAN, Fortinet, Python

\end{document}
`,
  sidebar: String.raw`\documentclass{sidebar}
\accentcolor{7e22ce}

\name{Noor Al Sayed}
\headline{Product Designer}
\email{noor.alsayed@example.com}
\phone{+973 3000 0010}
\location{Manama, Bahrain}
\website{example-noor.design}

\begin{document}

\section{Profile}
Product designer with 6 years of experience in fintech apps for Arabic and English users.

\section{Experience}
\entry{Senior Product Designer}{Example Pay}{2022 -- Present}{Manama}
\begin{itemize}
  \item Redesigned onboarding and raised completion from 54\% to 78\%.
  \item Built a right-to-left design system used by 5 teams.
\end{itemize}
\entry{Product Designer}{Example Studio}{2019 -- 2022}{Dubai}
\begin{itemize}
  \item Designed mobile apps for 7 clients in the GCC.
\end{itemize}

\section{Education}
\entry{BA Graphic Design}{Example University}{2015 -- 2019}{}

\begin{sidebar}
\section{Skills}
Figma, Prototyping, User research, Design systems

\section{Languages}
Arabic (Native), English (Fluent)

\section{Certifications}
Google UX Design, 2021
\end{sidebar}

\end{document}
`,
};

/** Snippets offered in the editor's guide. Each one is valid wherever the body of a CV goes. */
export const CV_GUIDE_SNIPPETS = {
  section: String.raw`\section{Experience}`,
  entry: String.raw`\entry{Job title}{Company}{2022 -- Present}{Dubai}`,
  list: String.raw`\begin{itemize}
  \item What you did and the result
\end{itemize}`,
  skills: String.raw`\skills{Languages}{Python, SQL}`,
  bold: String.raw`\textbf{bold text}`,
  link: String.raw`\href{https://github.com/you}{GitHub}`,
  percent: String.raw`30\% R\&D`,
  newpage: String.raw`\newpage`,
} as const;

export const cvSample = (template: CvTemplate) => SAMPLES[template];
