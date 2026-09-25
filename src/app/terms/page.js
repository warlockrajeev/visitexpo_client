'use client';

/**
 * @file app/terms/page.js
 * @description Official Terms and Conditions for VisitExpo.in.
 */

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar.js';
import Footer from '@/components/Footer.js';
import {
  FileText,
  ShieldCheck,
  Clock,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Mail,
  CheckCircle2,
  Scale
} from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-[#FF2E63] selection:text-white flex flex-col justify-between">
      <div>
        <Navbar solid={true} />

        {/* Hero Header */}
        <section className="bg-zinc-950 text-white pt-32 pb-16 px-4 sm:px-6 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#FFCC00]">Terms &amp; Conditions</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/20">
              <Scale className="h-3.5 w-3.5" />
              <span>Legal Agreement &amp; Operating Terms</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Terms and Conditions for VisitExpo.in
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                Updated &amp; Effective
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Universal Application to All Users
              </span>
            </div>
          </div>
        </section>

        {/* Main Content Body */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-12 leading-relaxed text-zinc-700 text-sm">

          {/* Callout Notice */}
          <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Notice to All Users</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900">
              Please review these Terms meticulously. By engaging with or utilizing the VisitExpo.in Platform, you signify your unequivocal agreement to these Terms, entering into a legally binding contract with <strong>VISIT EXPO</strong>.
            </p>
          </div>

          {/* Section: Introduction and Acceptance of Terms */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Introduction and Acceptance of Terms
            </h2>
            <p>
              Welcome to <strong>VisitExpo.in</strong>. Your access to and use of the VisitExpo.in website (located at visitexpo.in, herein referred to as the &ldquo;Site&rdquo;), along with any affiliated mobile applications or software (collectively, the &ldquo;VisitExpo.in Platform&rdquo;), are governed by these Terms and Conditions (&ldquo;Terms&rdquo;). These Terms delineate the legal rights and obligations concerning your interaction with our Services, which include the delivery of information and functionalities, whether currently existing or developed in the future.
            </p>
            <p>
              These Terms apply universally to all users of VisitExpo.in, past, present, and future, including those who utilize specialized dashboards or tools for managing event or business listings.
            </p>
            <p>
              We urge you to review these Terms meticulously. By engaging with or utilizing the VisitExpo.in Platform, you signify your unequivocal agreement to these Terms, thereby entering into a legally binding contract with <strong>VISIT EXPO</strong> referred to as &ldquo;VisitExpo.in,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo; and its affiliates. Should you disagree with any part of these Terms, or if you are incapable of being bound by them, you are prohibited from using the Services. Your use of the VisitExpo.in Platform is undertaken at your own discretion and risk, including potential exposure to content you may find objectionable or otherwise unsuitable.
            </p>
            <p>
              To utilize the Services, your prior acceptance of these Terms is mandatory. Acceptance can be demonstrated by:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                Affirmatively clicking to accept or agree to these Terms where such an option is presented within the user interface for any Service; or
              </li>
              <li>
                By your actual use of the Services. In such instances, you acknowledge and agree that VisitExpo.in will construe your use of the Services as an acceptance of these Terms from the moment of initial use.
              </li>
            </ul>
            <p>
              VisitExpo.in reserves the exclusive right to amend, modify, or update these Terms of Service at any time, without direct prior notification to You. This agreement imposes upon You the responsibility to periodically review these Terms of Service to remain informed of its stipulations. Your continued use of the Website or any of its services, with or without registration, subsequent to any such amendments, will be interpreted as your consent to the revised policies. Compliance with these Terms of Service, inclusive of any alterations, is a prerequisite for your ongoing use of the Website.
            </p>
          </section>

          {/* Section: Key Definitions */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Key Definitions
            </h2>
            <p>Throughout this document, the following terms shall have the meanings ascribed to them:</p>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="font-bold text-zinc-900 text-xs sm:text-sm">&ldquo;Agreement&rdquo;:</span>
                <span className="text-zinc-600 text-xs sm:text-sm ml-1.5">Refers to these Terms and Conditions, inclusive of all schedules, appendices, and any future amendments incorporated herein.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="font-bold text-zinc-900 text-xs sm:text-sm">&ldquo;VisitExpo.in Platform&rdquo; / &ldquo;Platform&rdquo;:</span>
                <span className="text-zinc-600 text-xs sm:text-sm ml-1.5">Denotes the Site, any related mobile applications, and the comprehensive suite of services and functionalities offered by VisitExpo.in.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="font-bold text-zinc-900 text-xs sm:text-sm">&ldquo;User&rdquo; / &ldquo;You&rdquo; / &ldquo;Your&rdquo;:</span>
                <span className="text-zinc-600 text-xs sm:text-sm ml-1.5">Signifies any individual or entity accessing, browsing, or otherwise employing the Services. This includes, but is not limited to, persons sharing, displaying, hosting, publishing, transacting, or uploading information, as well as those managing claimed business or event listings via any management interface.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="font-bold text-zinc-900 text-xs sm:text-sm">&ldquo;Content&rdquo;:</span>
                <span className="text-zinc-600 text-xs sm:text-sm ml-1.5">Encompasses, without limitation, all reviews, textual information, data, images, photographic works, audio or video materials, location data, event details, exhibitor information, and any other form of data or communication.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="font-bold text-zinc-900 text-xs sm:text-sm">&ldquo;User Content&rdquo;:</span>
                <span className="text-zinc-600 text-xs sm:text-sm ml-1.5">Content that You upload, share, submit, or transmit through or in connection with the Services, such as ratings, reviews, messages, images, profile details, and any materials publicly displayed or within your account.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="font-bold text-zinc-900 text-xs sm:text-sm">&ldquo;VisitExpo.in Content&rdquo;:</span>
                <span className="text-zinc-600 text-xs sm:text-sm ml-1.5">Content originated and made available by VisitExpo.in in connection with the Services. This includes visual interfaces, interactive elements, graphics, design, compilations, computer code, software, aggregated user data, reports, and all other components of the Services, excluding User Content and Third-Party Content.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="font-bold text-zinc-900 text-xs sm:text-sm">&ldquo;Third-Party Content&rdquo;:</span>
                <span className="text-zinc-600 text-xs sm:text-sm ml-1.5">Content originating from parties external to VisitExpo.in or its users, which is accessible via the Services.</span>
              </div>
            </div>
          </section>

          {/* Section: Eligibility for Service Use */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Eligibility for Service Use
            </h2>
            <p>
              You affirm and warrant that you are at least eighteen (18) years of age and possess the full legal capacity and competence to comprehend, accept, and adhere to the terms, conditions, obligations, affirmations, representations, and warranties detailed in these Terms. You further warrant compliance with all applicable laws and regulations in your country of residence when accessing and utilizing the Services. You commit to using the Services solely in conformity with these Terms and all relevant legal frameworks, and in a manner that does not infringe upon our legal rights or those of any third party.
            </p>
          </section>

          {/* Section: Modifications to Terms */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Modifications to Terms
            </h2>
            <p>
              VisitExpo.in may, at its sole discretion, vary, amend, change, or update these Terms periodically. It is your responsibility to review these Terms regularly to ensure your continued compliance. Your use of the VisitExpo.in Platform subsequent to any such modification will be deemed as your express acceptance of, and agreement to be bound by, the revised Terms.
            </p>
          </section>

          {/* Section: Provision and Nature of Services */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Provision and Nature of Services
            </h2>
            <p>
              VisitExpo.in is a dynamic platform, continually evolving to deliver the optimal experience and information to its users. You recognize and concur that the form and nature of the Services provided by VisitExpo.in may necessitate changes. Consequently, VisitExpo.in reserves the right to suspend, cancel, or discontinue any or all products or services at any time without prior notice, and to implement modifications and alterations to any or all of its content, products, and services available on the Site without advance notification.
            </p>
            <p>
              You acknowledge that if VisitExpo.in deactivates your account, your access to the Services, your account particulars, and any files or other content stored within your account may be barred.
            </p>
            <p>
              You further acknowledge that while VisitExpo.in may not currently impose a fixed upper limit on the volume of transmissions you may send or receive through the Services, such limits may be established by VisitExpo.in at its discretion at any future time.
            </p>
            <p>
              VisitExpo.in retains the right to introduce subscription and/or membership fees for any product, service, or aspect of the VisitExpo.in Platform in the future, subject to providing reasonable prior notice to users.
            </p>
          </section>

          {/* Section: 5.A. Specific Conditions for On-Site Virtual Tour or Broadcast Services */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              5.A. Specific Conditions for On-Site Virtual Tour or Broadcast Services
            </h2>
            <p>
              Should VisitExpo.in offer or facilitate services involving live broadcasting, virtual tours, content capture, or similar activities conducted by our representatives (including but not limited to videographers or staff) from physical exposition sites, event locations, or other third-party venues (&ldquo;On-Site Services&rdquo;), You acknowledge and expressly agree to the following specific conditions:
            </p>
            <p>
              VisitExpo.in shall not be held liable or responsible for any failure, interruption, delay, degradation in quality, or complete inability to provide or complete such On-Site Services, if such issues arise from, or are related to, any of the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Internet and Connectivity Failures:</strong> Unavailability, instability, inadequacy, or failure of internet connectivity, Wi-Fi, or any required network infrastructure at the physical event location.
              </li>
              <li>
                <strong>Personnel Unavailability or Incapacity:</strong> The unforeseen absence, illness, delay, or other incapacity of VisitExpo.in personnel, designated videographers, or other essential staff scheduled to perform the On-Site Services.
              </li>
              <li>
                <strong>Equipment Malfunction or Failure:</strong> The breakdown, malfunction, damage, or failure of any equipment essential for the provision of On-Site Services, including but not limited to cameras, audio recording devices, streaming hardware, data storage, power sources, or related technological components.
              </li>
              <li>
                <strong>Access Denial or Restrictions:</strong> The refusal of entry, revocation of previously granted access, or imposition of prohibitive restrictions by event organizers, venue management, security personnel, or any other authoritative body, thereby preventing VisitExpo.in representatives or videographers from accessing the event premises, specific areas within the venue, or from performing necessary tasks for the On-Site Services.
              </li>
              <li>
                <strong>General System Failures or Force Majeure Events:</strong> Any other systemic failure, unforeseen circumstance, or event beyond VisitExpo.in&rsquo;s reasonable control, including but not limited to power outages, critical software malfunctions, hostile actions, security incidents at the venue, adverse weather conditions, natural disasters, or governmental actions that directly impede or prevent the provision of the On-Site Services.
              </li>
            </ul>
            <p className="text-xs text-zinc-600 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              While VisitExpo.in will make commercially reasonable efforts to anticipate and mitigate such issues where practicable, we provide no guarantee of uninterrupted, flawless, or complete execution of On-Site Services. In the event that On-Site Services cannot be rendered or are significantly impaired due to any of the aforementioned circumstances, VisitExpo.in shall not be considered in breach of its obligations. Any fees paid specifically for such unrendered or significantly impaired On-Site Services will be addressed in accordance with VisitExpo.in&rsquo;s prevailing refund, credit, or remedy policy, if any, applicable to such specific services, as may be detailed separately or determined on a case-by-case basis at VisitExpo.in&rsquo;s sole discretion.
            </p>
          </section>

          {/* Section: Communications (Call, SMS, Email, Notifications) */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Communications (Call, SMS, Email, Notifications)
            </h2>
            <p>
              As an integral part of the Services, VisitExpo.in may dispatch reminders, alerts (&lsquo;notifications&rsquo;), via telephone call, SMS text message, application-based notification, or email to its users. You hereby acknowledge and consent to the receipt of such communications. VisitExpo.in may utilize various carriers for the delivery of these messages. You certify that you are the legitimate account holder of any mobile phone number provided to VisitExpo.in, or that you possess the explicit permission of the account holder to use the specified phone number for receiving communications from VisitExpo.in.
            </p>
            <p>
              Standard message and data rates may apply to communications. You understand and agree that the reception of such communications is not guaranteed to be 100% reliable and that timely response is your responsibility. Reception is dependent on the operational status of your mobile provider and/or internet service provider. VisitExpo.in bears no responsibility or liability for damages or costs incurred due to non-receipt or delayed receipt of communications, or due to deficiencies in your mobile network or internet service.
            </p>
            <p>
              You may opt-out of receiving these communications at any time through settings on the VisitExpo.in website or by sending a request to <a href="mailto:support@visitexpo.in" className="text-[#FF2E63] font-semibold hover:underline">support@visitexpo.in</a> clearly stating your phone number and/or email address.
            </p>
          </section>

          {/* Section: Mobile Software (If Applicable) */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Mobile Software (If Applicable)
            </h2>
            <p>
              Should VisitExpo.in offer mobile applications, we may collaborate with partners employing mobile Software Development Kits (SDKs) to passively gather information (&ldquo;SDK Information&rdquo;). This generally aids in delivering personalized notifications and may be used for cross-device/browser identification for customized advertising or content. Depending on granted permissions, this data could include Personally Identifiable Information (PII) such as your email address, precise location (GPS-level data), WiFi information, installed applications, and mobile identifiers (e.g., Android Advertising ID).
            </p>
            <div className="space-y-2 text-xs sm:text-sm pl-4 border-l-2 border-zinc-300">
              <p>
                <strong>Opting-out of Push Notifications:</strong> You can typically opt-out by adjusting notification settings in your device&rsquo;s &ldquo;Settings&rdquo; menu for specific applications. Device configurations and updates may alter how these settings function.
              </p>
              <p>
                <strong>Opting-Out of &ldquo;Cross-App&rdquo; Advertising:</strong> You can opt-out of mobile advertising identifiers being used for certain interest-based advertising by accessing your device settings (e.g., Google Settings app on Android, select Ads, then opt-out of interest-based ads).
              </p>
            </div>
          </section>

          {/* Section: General Disclaimer */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              General Disclaimer
            </h2>
            <p>
              Your use of VisitExpo.in Services signifies your agreement to the following: The Content provided through these Services is for informational purposes only. VisitExpo.in expressly disclaims liability for any information that may have become outdated or inaccurate since its last update. The VisitExpo.in Platform serves merely as a conduit where Users may engage as attendees, exhibitors, organizers, or service providers. Unless explicitly stated, VisitExpo.in is not a party to any service contracts formed between such Users.
            </p>
            <p>
              Furthermore, VisitExpo.in does not guarantee event entry based on actions taken on the platform (e.g., indicating intent to attend, follow, or register). The platform functions as an engagement and information resource. While VisitExpo.in endeavors to relay user requests effectively to event and business representatives, it has no control over the ultimate fulfillment of such requests. VisitExpo.in reserves the right to modify or correct any part of the Content on these Services at any time without prior notice. VisitExpo.in offers no guarantees regarding the quality of information or the accuracy of details such as event dates, venues, timings, or pricing.
            </p>
            <p>
              Unless otherwise indicated, all pictorial and informational content on these Services is presumed to be owned by or licensed to VisitExpo.in, or provided by third parties under relevant license agreements. If you are a copyright owner and believe your material is being used in a way that infringes your copyright, please submit a takedown request to <a href="mailto:support@visitexpo.in" className="text-[#FF2E63] font-semibold hover:underline">support@visitexpo.in</a> or via the &ldquo;<Link href="/contact" className="text-[#FF2E63] font-semibold hover:underline">Contact Us</Link>&rdquo; link, specifying the exact URL of the content in question. Digital reproductions of images may have been performed by VisitExpo.in or supplied by users/organizers. Unauthorized reproduction or republication of these digital versions in any format is prohibited without prior written consent from VisitExpo.in or the respective copyright holder.
            </p>
          </section>

          {/* Section: User Obligations and Account Management */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              User Obligations and Account Management
            </h2>
            <h3 className="font-bold text-zinc-900 text-sm">User Accounts and Listings Management</h3>
            <p>
              To access certain features of the Services, including but not limited to &lsquo;claiming a business listing&rsquo; or &lsquo;managing an event page&rsquo;, you must create an account. The use of personal information provided during account creation is governed by our Privacy Policy. You are responsible for maintaining the confidentiality of your password and for all activities that occur under your account, including all changes and updates submitted.
            </p>
            <p>
              Registration may also be possible via credentials from third-party social networking sites (e.g., Facebook, LinkedIn, Google). By using such methods, you confirm you own the social media account and are authorized to disclose its login information to us, and you authorize us to collect authentication and other information as per your settings on such platforms.
            </p>
            <p>
              When creating an account or claiming a business/event listing, you represent that all information provided is true, accurate, and complete, and you commit to updating it as necessary. If creating an account or claiming a listing on behalf of a business or event, you warrant that you are an authorized agent. Impersonation, creating accounts for others without authorization, providing false email addresses, creating multiple unauthorized accounts/listings, or falsely claiming listings is strictly prohibited and may lead to significant liability for damages incurred by VisitExpo.in or third parties.
            </p>
            <p>
              You are solely responsible for all activities under your account. Notify us immediately of any unauthorized use so corrective action can be taken. You agree not to permit any third party to use your VisitExpo.in account.
            </p>
            <p>
              By creating an account, you consent to receiving certain communications related to the VisitExpo.in Platform or Services (e.g., comments, connection requests, event updates). You can manage preferences for non-essential communications via account settings or by contacting us.
            </p>

            <h3 className="font-bold text-zinc-900 text-sm pt-2">General Usage Conduct</h3>
            <p>
              You agree to use the Services only for purposes permitted by (a) these Terms, and (b) any applicable law, regulation, or generally accepted practices in relevant jurisdictions. Data owned by VisitExpo.in (available via Services or API) is for personal, non-commercial use only, unless a separate written agreement with VisitExpo.in specifies otherwise (excluding standard use of &lsquo;Claim Your Listing/Event&rsquo; features).
            </p>
            <p>
              You agree not to access (or attempt to access) Services by any means other than the interface provided by VisitExpo.in, unless specifically authorized by a separate agreement. Automated access (e.g., scripts, web crawlers) is prohibited, and you must comply with instructions in any robots.txt file on the Services. You shall not engage in activities that interfere with or disrupt the Services (or connected servers/networks). You will not delete or alter material posted by other Users, nor engage in unsolicited spamming (emailing, posting, messaging).
            </p>
          </section>

          {/* Section: Intellectual Property and Content Rights */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Intellectual Property and Content Rights
            </h2>
            <h3 className="font-bold text-zinc-900 text-sm">Ownership of VisitExpo.in Content</h3>
            <p>
              VisitExpo.in is the sole and exclusive owner of all copyrights in the Services and our proprietary Content. We also exclusively own all intellectual property rights globally (&ldquo;IP Rights&rdquo;) associated with the Services and VisitExpo.in Content, including copyrights, trademarks, service marks, logos, trade names, and trade dress, protected by applicable intellectual property laws. You acknowledge the Services contain original works developed through substantial effort and investment, constituting valuable intellectual property.
            </p>
            <p>
              Information designated confidential by VisitExpo.in must not be disclosed without our prior written consent. You agree to protect VisitExpo.in&rsquo;s and its licensors&rsquo; proprietary rights in the Services. You acknowledge that VisitExpo.in (or its licensors) own all legal right, title, and interest in the Services, including all IP Rights. Unless agreed otherwise in writing, these Terms do not grant you any right to use VisitExpo.in&rsquo;s trade names, trademarks, service marks, logos, domain names, or other distinctive brand features.
            </p>
            <p>
              You agree not to use framing techniques for VisitExpo.in trademarks or proprietary information, nor remove or obscure any copyright or proprietary notices. Infringement will lead to legal action. Modification, reproduction, public display, or exploitation of VisitExpo.in Content, in whole or part, is forbidden without express authorization. We do not warrant that your use of materials displayed on the Services will not infringe third-party rights. Notify us immediately of any claim that the Services infringe any copyright, trademark, or other rights.
            </p>

            <h3 className="font-bold text-zinc-900 text-sm pt-2">License to Use VisitExpo.in Content</h3>
            <p>
              We grant you a personal, limited, non-exclusive, non-transferable license to access and use the Services solely as expressly permitted by these Terms, for personal, non-commercial purposes. You shall not use, copy, display, distribute, modify, broadcast, translate, reproduce, reformat, incorporate into advertisements, sell, promote, create derivative works from, or exploit any VisitExpo.in Content without our express written authorization. No other express or implied rights or licenses are granted. Violation of these license provisions may result in immediate termination of your right to use the Services and potential liability for IP Rights infringement.
            </p>

            <h3 className="font-bold text-zinc-900 text-sm pt-2">License You Grant to VisitExpo.in for User Content</h3>
            <p>
              By submitting Your Content, you irrevocably grant VisitExpo.in a perpetual, irrevocable, worldwide, non-exclusive, royalty-free, sublicensable, and transferable license and right to use Your Content (and all IP Rights therein) for any purpose, including API partnerships and in any media, existing now or in the future. &ldquo;Use&rdquo; includes copying, displaying, distributing, modifying, translating, reformatting, incorporating into advertisements, promoting, and creating derivative works. You grant us the right to use the name/username submitted with Your Content. You waive all claims of moral rights or attribution regarding Your Content against VisitExpo.in, its Users, and third-party services.
            </p>

            <h3 className="font-bold text-zinc-900 text-sm pt-2">Representations Regarding Your Content</h3>
            <p>
              You are solely responsible for Your Content. You represent and warrant that: you are the sole author, owner, or have explicit permission from the rights holder to submit Your Content; it was not copied or based on other works; it was not submitted via automated processes; its use by us or third parties will not infringe any rights; it is truthful and accurate; and it complies with our Guidelines, Policies, and applicable laws.
            </p>
            <p>
              If Your Content is a review, you warrant it reflects an actual experience, you were not compensated for it, and you had no undisclosed incentive. You assume all risks associated with Your Content, including reliance on its quality or accuracy, or any personally identifiable information you disclose. While we may remove Content, we do not control user-posted Content and do not guarantee its accuracy or quality. Liability for user-posted Content rests solely with the posting user.
            </p>

            <h3 className="font-bold text-zinc-900 text-sm pt-2">Content Removal</h3>
            <p>
              We reserve the right, at any time and without notice, to remove, block, or disable access to any Content that we, for any or no reason, deem objectionable, in violation of these Terms, or harmful to the Services or our users, in our sole discretion. We are not obligated to return Your Content under any circumstances, subject to applicable law. Derogatory, defamatory, hateful, or policy-violating reviews without substantial evidence may be removed at our discretion.
            </p>

            <h3 className="font-bold text-zinc-900 text-sm pt-2">Third-Party Content and Links</h3>
            <p>
              Services may include or link to third-party materials (e.g., event registration, ticketing, hotel services). Your use of such third-party services is governed by their respective terms and privacy policies. We may obtain contact information from third-party vendors or public sources. We do not control, endorse, or make representations about the accuracy, relevance, legality, or quality of third-party products, services, or content. We do not screen third-party material.
            </p>
            <p>
              We reserve the right, without obligation, to correct errors or omissions in any content. We are not liable for delays or inaccuracies in updates. You acknowledge VisitExpo.in is not responsible for the availability or content of external sites/resources and does not endorse their advertising or products. Third-party content, including user-posted content, does not reflect our views. We assume no liability for Your Content or third-party content. VisitExpo.in is not liable for loss or damage incurred from reliance on external sites/resources. We expressly disclaim liability for offensive, defamatory, or infringing content from third parties.
            </p>

            <h3 className="font-bold text-zinc-900 text-sm pt-2">User Reviews</h3>
            <p>
              User reviews or ratings do not reflect VisitExpo.in&rsquo;s opinion but are the personal opinions of the individual users. VisitExpo.in is a neutral platform facilitating communication. Advertisements on the Platform are independent of reviews. While we do not arbitrate disputes, listing owners/representatives may contact reviewers or post public responses. If a review is believed to violate VisitExpo.in policies, representatives may report it to <a href="mailto:support@visitexpo.in" className="text-[#FF2E63] font-semibold hover:underline">support@visitexpo.in</a>. VisitExpo.in may remove reviews violating Terms or guidelines at its sole discretion.
            </p>
          </section>

          {/* Section: Content Guidelines and Privacy */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Content Guidelines and Privacy
            </h2>
            <p>
              <strong>Content Standards:</strong> You affirm that you have read, understood, and consent to our Content Guidelines and Policies (<a href="https://visitexpo.in" className="text-[#FF2E63] font-semibold hover:underline">visitexpo.in</a>).
            </p>
            <p>
              <strong>Privacy Commitment:</strong> You affirm that you have read, understood, and consent to our <Link href="/privacy" className="text-[#FF2E63] font-semibold hover:underline">Privacy Policy</Link>. Note that we may disclose information about you to third parties or government authorities if reasonably necessary to: (i) address suspected illegal activities; (ii) enforce our Terms and Privacy Policy; (iii) comply with legal processes or government inquiries (e.g., warrants, subpoenas); or (iv) protect the rights, reputation, and property of VisitExpo.in, our users, affiliates, or the public.
            </p>
          </section>

          {/* Section: Prohibited Uses and Activities */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Prohibited Uses and Activities
            </h2>
            <p>
              In your use of the Services, you expressly agree not to post, transmit, or engage in any content or activity that, in our sole determination:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
              <li>Breaches our established Content Guidelines and Policies.</li>
              <li>Is harmful, threatening, abusive, harassing, tortious, indecent, defamatory, discriminatory, vulgar, profane, obscene, libelous, hateful, or otherwise objectionable; or encourages activities like money laundering or gambling; or invades another&rsquo;s privacy, including bodily privacy.</li>
              <li>Constitutes an inauthentic, knowingly erroneous, or misleading review; or fails to address the services, atmosphere, or attributes of the entity being reviewed.</li>
              <li>Contains material that contravenes the standards of the Services.</li>
              <li>Infringes any third-party right, including rights of privacy, publicity, copyright, trademark, patent, trade secret, or other intellectual or proprietary rights.</li>
              <li>Makes accusations of illegal activity against others or describes physical confrontations.</li>
              <li>Is illegal or violates any federal, state, or local law or regulation (e.g., disclosing or trading on inside information in violation of securities law).</li>
              <li>Attempts to impersonate another person or entity.</li>
              <li>Obscures or attempts to obscure the origin of Your Content, such as by submitting it under a false name or disguising the IP address of submission.</li>
              <li>Is knowingly and intentionally used to communicate information that is patently false, grossly offensive, menacing, or misleading, yet may reasonably be perceived as factual; or is intended to harass any person, entity, or agency for financial gain or to cause injury.</li>
              <li>Constitutes deceptive advertising or results from a conflict of interest.</li>
              <li>Is commercial in nature where not explicitly permitted, including spam, surveys, contests, pyramid schemes, or reviews submitted/removed for payment or at the request of the reviewed business (unless clearly disclosed as sponsored).</li>
              <li>Asserts or implies that Your Content is sponsored or endorsed by VisitExpo.in.</li>
              <li>Contains material not in English (or the relevant language for services provided in foreign languages, if the platform supports it).</li>
              <li>Falsely states, misrepresents, or conceals your affiliation with another person or entity.</li>
              <li>Accesses or uses another user&rsquo;s account without permission.</li>
              <li>Distributes computer viruses or other malicious code designed to interrupt, destroy, or limit the functionality of computer software, hardware, or telecommunications equipment.</li>
              <li>Interferes with, disrupts, or harms the functionality of the Services or connected servers/networks.</li>
              <li>Involves &ldquo;hacking&rdquo; or unauthorized access to our proprietary or confidential records, or those of other users.</li>
              <li>Violates any contractual or fiduciary relationship (e.g., disclosing proprietary information in breach of an employment or non-disclosure agreement).</li>
              <li>Decompiles, reverse engineers, disassembles, or otherwise attempts to derive the source code of the Services, except as permitted by law or by us in writing.</li>
              <li>Removes, circumvents, disables, or interferes with security features of the Services or features that restrict content use or enforce usage limitations.</li>
              <li>Collects, harvests, or posts personally identifiable information about other users without their explicit consent.</li>
            </ol>
          </section>

          {/* Section: Indemnification */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Indemnification
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless VisitExpo.in, its parent company, subsidiaries, affiliates, officers, directors, employees, agents, licensors, and suppliers from and against all claims, losses, liabilities, expenses, damages, and costs, including reasonable attorneys&rsquo; fees, arising out of or resulting from any violation of these Terms by you, any User Content you submit, or any activity related to your account (including negligent or wrongful conduct) by you or any other person accessing the Services using your account.
            </p>
          </section>

          {/* Section: Disclaimer of Warranties */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Disclaimer of Warranties
            </h2>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 uppercase text-xs tracking-wide leading-relaxed text-zinc-700">
              THE SERVICES AND ALL CONTENT ON THE VISITEXPO.IN PLATFORM ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, VISITEXPO.IN DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. VISITEXPO.IN DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR THAT DEFECTS WILL BE CORRECTED, OR THAT THE SERVICES OR THE SERVERS HOSTING THEM ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. VISITEXPO.IN MAKES NO WARRANTIES OR REPRESENTATIONS REGARDING THE USE OR THE RESULTS OF THE USE OF THE CONTENT OR OTHER MATERIALS ON THE SERVICES IN TERMS OF THEIR CORRECTNESS, ACCURACY, RELIABILITY, TIMELINESS, OR OTHERWISE. YOU ACKNOWLEDGE THAT YOUR USE OF THE SERVICES IS AT YOUR SOLE RISK.
            </div>
          </section>

          {/* Section: Limitation of Liability */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Limitation of Liability
            </h2>
            <div className="space-y-3 uppercase text-xs tracking-wide leading-relaxed text-zinc-700 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL VisitExpo.in, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, LICENSORS, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES) ARISING OUT OF OR RELATING TO YOUR ACCESS TO, USE OF, OR INABILITY TO ACCESS OR USE, THE SERVICES OR ANY CONTENT OR MATERIALS ON THE SERVICES, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY, EVEN IF VISITEXPO.IN HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p>
                VISITEXPO.IN&rsquo;S TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE SERVICES OR THESE TERMS, WHETHER IN CONTRACT, TORT, OR OTHERWISE, SHALL NOT EXCEED THE GREATER OF: (I) THE TOTAL AMOUNT, IF ANY, PAID BY YOU TO VISITEXPO.IN FOR ACCESS TO AND USE OF THE SERVICES DURING THE TWELVE (12) MONTH PERIOD IMMEDIATELY PRECEDING THE EVENT(S) GIVING RISE TO SUCH CLAIM, OR (II) ONE HUNDRED UNITED STATES DOLLARS (USD $100.00) OR ITS EQUIVALENT IN LOCAL CURRENCY.
              </p>
            </div>
            <p className="text-xs text-zinc-500">
              SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES OR THE LIMITATION OR EXCLUSION OF LIABILITY FOR CERTAIN TYPES OF DAMAGES. ACCORDINGLY, SOME OF THE ABOVE LIMITATIONS AND DISCLAIMERS MAY NOT APPLY TO YOU.
            </p>
          </section>

          {/* Section: Termination of Access */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Termination of Access
            </h2>
            <p>
              VisitExpo.in reserves the right, in its sole discretion, to terminate or suspend your access to all or part of the Services, with or without notice, for any reason, including, without limitation, breach of these Terms. We may terminate or suspend your access immediately and without prior notice if there is a legitimate reason, such as a material violation of these Terms.
            </p>
            <p>
              Upon any termination, your right to use the Services will immediately cease. All provisions of these Terms that by their nature should survive termination shall so survive, including, without limitation, ownership provisions, warranty disclaimers, indemnity obligations, and limitations of liability.
            </p>
          </section>

          {/* Section: Governing Law and Dispute Resolution */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              Governing Law and Dispute Resolution
            </h2>
            <p>
              These Terms and any dispute or claim arising out of or in connection with them or their subject matter or formation, without giving effect to any choice or conflict of law provision or rule.
            </p>
            <p>
              You agree that any legal suit, action, or proceeding arising out of or related to these Terms or the Services shall be instituted exclusively in the federal or state courts located. You waive any and all objections to the exercise of jurisdiction over you by such courts and to venue in such courts.
            </p>
          </section>

          {/* Section: Severability, Waiver, Entire Agreement */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
              General Provisions
            </h2>
            <p>
              <strong>Severability:</strong> If any provision or part-provision of these Terms is or becomes invalid, illegal, or unenforceable, it shall be deemed modified to the minimum extent necessary to make it valid, legal, and enforceable. If such modification is not possible, the relevant provision or part-provision shall be deemed deleted. Any modification to or deletion of a provision or part-provision under this clause shall not affect the validity and enforceability of the rest of these Terms.
            </p>
            <p>
              <strong>Waiver:</strong> No failure or delay by VisitExpo.in in exercising any right or remedy provided under these Terms or by law shall constitute a waiver of that or any other right or remedy, nor shall it prevent or restrict the further exercise of that or any other right or remedy. No single or partial exercise of such right or remedy shall prevent or restrict the further exercise of that or any other right or remedy.
            </p>
            <p>
              <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy and any other legal notices or terms published by VisitExpo.in on the Services (such as Content Guidelines), constitute the entire agreement between you and VisitExpo.in concerning your use of the Services and supersede all prior agreements, proposals, or representations, whether written or oral, between you and VisitExpo.in regarding the subject matter.
            </p>
          </section>

          {/* Section: Contact Information */}
          <section className="space-y-4 pt-4 border-t border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900">
              Contact Information
            </h2>
            <p>
              For any questions, concerns, or comments regarding these Terms, please contact us at:
            </p>
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-zinc-500 tracking-wider block">
                  VISIT EXPO Legal &amp; Support
                </span>
                <span className="font-bold text-zinc-900 text-sm">Support Email:</span>{' '}
                <a href="mailto:support@visitexpo.in" className="text-[#FF2E63] font-bold hover:underline">
                  support@visitexpo.in
                </a>
              </div>
              <Link
                href="/contact"
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors shrink-0"
              >
                Contact Helpdesk
              </Link>
            </div>
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
}
