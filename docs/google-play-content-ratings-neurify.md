# Neurify — Google Play Content Ratings

**Use this guide in:** Play Console → **Policy and programs** → **App content** → **Content ratings**. The rating outcome is calculated from the questionnaire, and Google requires answers to accurately describe all content and features in the app.[1]

> **Important:** These are recommended answers for the current Neurify build. Do not submit an answer that differs from the installed AAB. The app is for approved healthcare staff, has sign-in, clinical coordination, clinician-to-clinician messaging and file attachments, but no ads, games, purchases, public social network, or patient-visible consumer content.

## Start of questionnaire

| Console field | Recommended entry |
|---|---|
| Contact email | Use the monitored Play Console owner email. If required for this release, use `m.ibraheim@rfhc.gov.sa`. |
| App or game | **App** |
| Best category when asked | **Utility, Productivity, or Communication**. It is an internal clinical workflow application, not a game or consumer social network. |

## Questionnaire answers

| Question or topic shown by Google Play | Recommended answer | Explanation to use if a text box appears |
|---|---|---|
| Violence, death, injury, weapons, or graphic content | **No** | Neurify does not provide entertainment, depictions of violence, or graphic media. Do not change this to **No** if a future release deliberately adds unmoderated graphic clinical photos or videos. |
| Sexual content, nudity, or romantic content | **No** | The application provides no sexual, nude, or romantic content. |
| Profanity, crude humor, or hateful content | **No** | The published app does not provide such content. |
| Drugs, alcohol, tobacco, gambling, or references to controlled substances | **No** | It has no consumer content promoting or facilitating these activities. Clinical documentation is not consumer promotion. |
| Fear or horror content | **No** | No horror, frightening scenarios, or jump-scare content is provided. |
| Simulated gambling or contests | **No** | No gambling, prize, betting, or contest functionality exists. |
| Advertisements | **No** | Neurify does not serve ads. Keep this answer synchronized with **Target audience and content**. |
| In-app purchases, paid digital goods, or subscriptions | **No** | The app has no in-app payments or purchases. |
| Unrestricted web browsing or access to an open internet browser | **No** | Links are limited to defined functions such as the privacy policy and do not provide general web browsing. |
| Users can interact, exchange messages, or share content | **Yes** | Authorized clinical-team members can use approved internal discussions and case messaging, including permitted attachments. Access is invitation/approval based and not public. |
| User-generated content | **Yes** | Authorized users can create messages, operational notes, and permitted attachments. Do **not** select **No** merely because the application is internal. |
| Interaction is public or open to unknown users | **No** | Interaction is restricted to approved Neurify accounts and departmental teams; there is no public profile discovery or public feed. |
| AI-generated content, if asked | **Yes** | Gemini prepares a structured medical-report draft from minimized documented data. A clinician reviews, edits, and explicitly approves it before export; it is not an open public AI chatbot. |
| Location sharing | **No** | The current build does not collect or share device location. |
| Personal information, health data, or sensitive data | Answer in **Data safety**, not by understating the feature here | The app handles restricted clinical information for approved staff. Complete Data safety consistently with the privacy policy. |

## Target audience (separate page)

Choose **Ages 18 and over** only. Neurify is intended solely for authorized adult healthcare personnel and is not designed for children, patients, or the general public. Google requires an accurate target audience declaration even when an app is not designed for children.[2]

## Before selecting Submit

Verify the following statements against the AAB you uploaded: no advertisements; no payments; internal staff-only sign-in; user messaging and attachments are enabled; the app does not expose a public community; and the privacy policy is available at `https://neurify.manus.space/privacy`.

If Google Play displays a question with wording that is materially different from this table, save the draft, take a screenshot with no patient data, and request a clarification before submitting. Inaccurate questionnaire responses can result in an incorrect rating or enforcement action.[1]

## References

[1]: https://support.google.com/googleplay/android-developer/answer/9859655?hl=en "Google Play: Content rating requirements for apps, games, and ads"
[2]: https://support.google.com/googleplay/android-developer/answer/9867159?hl=en "Google Play: Manage target audience and app content settings"
