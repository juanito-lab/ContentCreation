# What the research says: retention, captions, hashtags, music, testing

Compiled October 2026 by two research agents for Jasper Kallfelz's shortform-edit-kit (original in German), summarized and translated here. Sources were opened, some only as abstracts. **Check a source yourself before quoting a number.** Labels: **[D]** documented by the platform, **[E]** supported by data or studies, **[R]** rule of thumb or not backed.

## 1. What makes people watch to the end

| Lever | Evidence | Finding | For the edit |
|---|---|---|---|
| The first 3 seconds | medium | TikTok + Kantar, 3,500 ads, correlational: tension at the start → +16% watch time [E] | open on the strongest image |
| Emotional peaks | medium–strong | joy and surprise hold viewers (Teixeira et al. 2012, video ads) [E] | one clear peak, tied to the content (`climax`) |
| Faces | medium, photos only | Instagram photos with faces get more likes and comments (Bakhshi et al. 2014); Li & Xie 2020 found no effect [E] | face big and early when there is one |
| Text on screen | strong, for comprehension | review of 100+ studies (Gernsbacher 2015) [E] | keep it, word by word with the voice |
| Vocals under speech | medium, measured on reading | meta-analysis of 65 studies: sung music distracts more than instrumental (Vasilev et al. 2018) [E] | instrumental or nothing under the voice |
| Speaking pace | weak, lecture videos | faster, more energetic delivery is watched longer (Guo et al. 2014) [E] | tighten pauses (`voice_assemble.py`) |
| Cut rate | weak | more cuts → more arousal and recall (Lang et al. 2000, TV) [E] | a cut every 2–3 s is enough |
| Saturation | not a lever | 7.6 M Flickr photos: saturation filters barely change views; warmth, contrast and exposure matter more (Bakhshi et al. 2015) [E] | match clips, keep skin tones natural |

Not backed: an "ideal length", a "1.7-second window", "best colours" [R].
Measure: share still watching after 3 s, share to the end, rewatches.

## 2. Captions and hashtags

- **Instagram:** at most 5 hashtags per post since December 2025; specific beats generic [D, via trade press]. The caption is used for keyword search [D]. That it drives reach in recommendations was never shown; Instagram's ranking explanation for Reels mentions neither caption nor hashtags [D].
- **TikTok:** 3–4 relevant hashtags, "more doesn't mean better" [D]. Search matches content, hashtags and sound [D]. An opening line or question that invites comments works better than a plain description [D].
- **Length:** about the same across lengths for Reels, only very long captions do worse [E, weak, vendor data].
- **What actually counts:** watch time, likes and shares; shares matter most for reaching non-followers (head of Instagram, January 2025) [D, via trade press]. Captions and hashtags are secondary.
- No #fyp, no #viral: no evidence they do anything [R].

## 3. Uploading

- Upload the original file natively, never a video with another app's watermark [D]. On Instagram, turn on "Upload at highest quality" [D].
- Instagram shows reels less that are muted, blurry or mostly covered by text [D].
- Cover: TikTok recommends 1080 × 1920 with text that sums up the video [D]. Instagram's profile grid shows the centre, so the title goes in the middle [D].
- Best time: generic tables are weak; use your own followers' most active times from the insights [R].
- Through TikTok's API only a cover frame (by timestamp) can be chosen, not a custom image [D].

## 4. Music

- **Instagram:** content with third-party music can be "blocked, muted or removed" without permission; commercial use needs a licence [D]. Reels with music from Instagram's library or original audio are recommended [D].
- **TikTok:** posts can be removed and repeated violations lose the account [D]. Businesses should use the Commercial Music Library [D].
- **Safe:** upload the no-music version and add the song in the app, or use licensed music, or only voice and effects.

## 5. Trial reels, variants, reposting

- **Instagram trial reels:** for professional accounts; shown to non-followers first and not on your profile grid until you choose "Share to everyone". Results after about 24 hours; optionally Instagram shares automatically if it performs in the first 72 hours [D]. The help page warns that a trial reel may get limited reach if the same content was shared before [D]. Follower thresholds and daily limits aren't documented [R]. (`post.py` can post trial reels: `instagram.trialParams` in [posting.md](posting.md).)
- **Variants:** trial reels are the only official testing tool for organic content on Instagram [D]; none was found for TikTok [R]. Your own recordings count as original [D]; how similar two videos may be isn't documented [R].
- **Reposting the same video weeks later:** not documented as forbidden. Instagram shows already-posted reels less [D, 2023]; TikTok doesn't re-recommend what someone has already seen [D]. No solid data on whether it helps [R]. Safer: a new export with a changed opening, a different cover and a different caption.
- **Small accounts:** at about 200 views per variant a rate swings by roughly ±7 percentage points; a real difference only shows from about 14 points (the agents' own calculation). So change one thing per round, the first 1.5 seconds first, and wait at least 72 hours.
- **Compare:** drop-off in the first 3 seconds, average watch time, shares per reach, new followers. Likes alone are too weak.

## Sources (selection)

Retention:
- Bakhshi et al. 2015, "Why We Filter Our Photos and How It Impacts Engagement", ICWSM: https://ojs.aaai.org/index.php/ICWSM/article/view/14622
- Li & Xie 2020, "Is a Picture Worth a Thousand Words?", Journal of Marketing Research: https://doi.org/10.1177/0022243719881113
- Teixeira, Wedel & Pieters 2012, "Emotion-Induced Engagement in Internet Video Advertisements", JMR: https://research.tilburguniversity.edu/en/publications/emotion-induced-engagement-in-internet-video-ads/
- Guo, Kim & Rubin 2014, "How Video Production Affects Student Engagement": https://up.csail.mit.edu/other-pubs/las2014-pguo-engagement.pdf
- Gernsbacher 2015, "Video Captions Benefit Everyone": https://doi.org/10.1177/2372732215602130
- Vasilev et al. 2018, meta-analysis on background noise and reading: https://pmc.ncbi.nlm.nih.gov/articles/PMC6139986/
- Lang et al. 2000, cut rate in television: https://doi.org/10.1207/s15506878jobem4401_7
- Isola et al. 2014, memorability of images: https://people.csail.mit.edu/torralba/publications/Isola_memorabilityPhotos_PAMI2014.pdf
- TikTok Creative Codes 2022 (platform data): https://ads.tiktok.com/business/library/Creative_Codes_ENG.pdf

Platform documentation:
- Instagram trial reels: https://help.instagram.com/1013292530224018/ and https://creators.instagram.com/blog/instagram-trial-reels
- Instagram, recommended and less-shown reels: https://help.instagram.com/1525585517644948/
- Instagram ranking explained: https://about.instagram.com/blog/announcements/instagram-ranking-explained
- Instagram original content: https://creators.instagram.com/original-content-guidelines
- Instagram music: https://help.instagram.com/402084904469945 and https://www.facebook.com/legal/music_guidelines
- TikTok, how content is recommended: https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content
- TikTok Creator Academy checklist: https://www.tiktok.com/creator-academy/en/article/high-quality-checklist-rewards
- TikTok Creator Academy, covers: https://www.tiktok.com/creator-academy/en/article/video-covers-thumbnails
- TikTok copyright policy: https://www.tiktok.com/legal/page/global/copyright-policy/en
- TikTok Commercial Music Library: https://ads.tiktok.com/resources/help/article/commercial-music-library
- TikTok Content Posting API: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post

Trade press on platform statements:
- Ranking signals (January 2025): https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/
- 5-hashtag limit (December 2025): https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/
- Drop-off rate in Reels insights (August 2025): https://www.socialmediatoday.com/news/instagram-adds-retention-insights-reels/758464/
