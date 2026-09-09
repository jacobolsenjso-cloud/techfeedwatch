---
title: "What Is Lateral Movement Risk in Modern IT?"
targetQuestion: "what is lateral movement risk"
youtubeId: "k6Vd_wnYbhA"
channelTitle: "Security BSides Bangalore"
channelId: "UC0SqOU2NDDIP0bbt5OwW8Hw"
publishedAt: "2026-07-29T08:00:20Z"
date: "2026-07-30"
tags:
  - "Cybersecurity"
  - "AI & Tech"
summary: "Cybersecurity experts at ACSC2024 highlighted the escalating threat of lateral movement techniques against cloud, SaaS, and hybrid infrastructure. As organizations embrace distributed IT environments, attackers are exploiting new vulnerabilities beyond traditional perimeters. This shift demands a re-evaluation of security postures, moving towards continuous verification and adaptive defense strategies."
metaDescription: "Understand lateral movement threats in cloud, SaaS, and hybrid infrastructure. Learn how modern cybersecurity protects data from evolving attacks."
duration: "28:15"
viewCount: 21
viewsUpdated: "2026-08-16"
thumbMax: false
isShort: false
faqs:
  - question: "What is shadow access in cybersecurity?"
    answer: "Shadow access refers to situations where users or entities have permissions to systems or data that are not explicitly visible or accounted for by standard security tools. This often happens through inherited permissions from groups or misconfigurations, making it difficult for security teams to track the true scope of access."
  - question: "How do grouping systems contribute to lateral movement threats?"
    answer: "Grouping systems like Google Groups or Azure Groups can grant broad access to resources. When new members are added to these groups, they automatically inherit all associated permissions, often without explicit review or knowledge from security teams, creating unintended access pathways that attackers can exploit."
  - question: "Can PIM/PAM tools prevent lateral movement?"
    answer: "PIM/PAM tools are designed to manage and secure privileged human access, but they can be bypassed if an attacker compromises non-human identities like service accounts or workload identities. These tools often lack the full context of an organization's distributed infrastructure, leaving gaps that attackers can exploit to move laterally."
  - question: "Why are cloud environments more susceptible to lateral movement than on-premise systems?"
    answer: "Cloud environments are highly interconnected, with extensive use of IAM roles, service accounts, and transitive permissions across various services. This complexity, combined with the reliance on third-party identity providers, creates more opportunities for attackers to exploit misconfigurations and move from one compromised point to another across the distributed infrastructure."
rewrittenAt: "2026-08-18"
---

Lateral movement techniques pose a major threat to modern IT environments, allowing attackers to expand their access from an initial point of compromise to critical systems. This escalating risk stems from the distributed nature of cloud, SaaS, and hybrid infrastructures, where traditional perimeter defenses are no longer sufficient. A re-evaluation of security postures is urgently needed, shifting towards continuous verification and adaptive defense strategies to counter these advanced threats.

## The Hidden Dangers of Identity and Access Management

Many organizations rely on cloud provider Identity and Access Management (IAM) tools, such as those offered by GCP, AWS, and Azure AD, as their primary source of truth for user permissions. However, these tools often present an incomplete picture of who has access to what. This oversight creates "shadow access," where users, or even the security teams, are unaware of the full scope of privileges granted. The core issue lies in how permissions can be inherited or implicitly granted through complex relationships, leading to what is known as transitive privilege escalation. Security solutions frequently miss these transitive users, leaving major gaps in an organization's defense.

## How Attackers Exploit Grouping Systems

A common vulnerability arises from the widespread use of grouping systems like Google Groups, Azure Groups, or similar features in SaaS applications. These groups are often created for convenience, such as simplifying meeting invitations or managing team access to resources. For instance, a group like `devs@amc.com` might be granted `BigQuery user` access in GCP. While the GCP IAM interface shows the group name, it does not list individual members. To understand who truly has access, one must check the group's membership in Google Groups.

This practice becomes problematic when a new employee or intern joins a team and is added to such a group. They automatically inherit all the group's permissions, including those to critical cloud resources, without direct provisioning or explicit knowledge from the infrastructure team. This indirect access is often invisible to standard IAM monitoring tools and can be easily exploited if an intern's credentials are compromised, even if they were never directly granted access to the sensitive resources.

## Bypassing Common Security Controls

Even advanced security solutions like Privileged Identity Management (PIM) and Privileged Access Management (PAM) tools can be circumvented by attackers. These tools often focus on managing human user access, typically by automating login processes or enforcing multi-factor authentication. However, they frequently overlook alternative access vectors. For example, a developer might have a service account or workload identity bound to their corporate email ID. If their Google Workspace account is deactivated upon leaving the company, the associated service account might remain active, allowing the ex-employee to retain access to the infrastructure.

Attackers can exploit these service accounts, which are designed for automated processes and often carry major privileges. By compromising a service account, they can bypass the PIM/PAM controls designed for human users. This is not a highly technical bypass; it exploits basic gaps in how access is managed across different identity types and systems. Cloud security tools, source code security tools, and Identity Governance and Administration (IGA) tools each focus on their specific domain, often missing the broader context of the infrastructure, including permissions inherited from Google Groups, Azure AD, or Okta.

## Lateral Movement in Cloud and Kubernetes Environments

The problem of shadow access and transitive privileges is particularly acute in cloud and containerized environments. In Kubernetes, for example, the system itself does not manage users directly. Instead, it relies on third-party identity providers and protocols like OIDC (OpenID Connect) to authenticate users, often linking to Google Groups or Azure AD. This means that if an engineering manager adds someone to a Google Group, that person automatically gains Kubernetes access based on the group's bindings, even if they have never used Kubernetes before.

Consider a scenario where a `dev interns` group has minimal access, perhaps only to create pods, while a `dev team` group has highly privileged access to create pods, services, and deployments. If an intern's credentials are compromised, an attacker can use the intern's ability to create a malicious pod. Inside this pod, the attacker can access the mounted default service account token, which is often a JSON Web Token (JWT). This token can then be used to discover and exploit elevated service accounts within the same infrastructure, potentially leading to full cluster compromise. The root cause of many data breaches, including the 2016 Uber incident, often traces back to compromised credentials, such as hardcoded AWS credentials in a repository. This allowed an attacker to download sensitive PII data. Uber paid $100,000 to cover up the incident, which was not disclosed for one year, leading to the CEO's termination.

## The Real-World Impact and What to Do

The consequences of lateral movement and privilege escalation are severe. Statistics show that 60% of companies go bankrupt within the first six months after a data breach due to fines and recovery costs. The average cost of a data breach is $4.45 million, with some incidents affecting as many as 250 million users. Most major data breaches today occur in cloud environments like AWS and GCP, rather than on-premise databases, precisely because of the interconnectedness of IAM and service accounts. Once one component is compromised, attackers can jump across the entire infrastructure.

To mitigate these risks, organizations must move beyond simply trusting cloud providers' default IAM views. A complete understanding of all access paths, including transitive privileges and shadow access, is essential. This requires integrating context from various identity sources like Google Groups, Azure AD, and Okta into security monitoring. Instead of solely focusing on offensive security techniques, organizations should prioritize building and implementing strong internal systems for detecting and fixing security issues. This proactive approach, centered on continuous verification and adaptive defense, is vital for protecting valuable assets in today's distributed IT environment.
