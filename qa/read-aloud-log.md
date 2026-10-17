## Read-aloud check

Every line was read in all seven crew setups (`node tools/check-story.ts --print`), as the parent of a 4½- and a 2½-year-old would hear it: is it clear, warm, never preachy, never scary, and does it read naturally with one child or with "Captain" and "Co-pilot"?

### Cuts and changes

| Where | Before | After | Why |
|---|---|---|---|
| M3 p3 (before the bump) | "Tommy, can you help us spin?" / "Tommy, can you help bounce the ball?" | "Tommy, can you count the somersaults?" / "Tommy, can you count the bounces?" | Tommy's taps came right before the accident. A 2½-year-old could feel he caused the bump; the accident should be nobody's fault. |
| M3 p4-hide | "Button thought it was Button's fault. But it wasn't." | "Button thought it had done something wrong. But it hadn't." | Clumsy, and confusing read aloud. |
| M3 p1 | "…It's called the Sun Catcher. It charges Button's batteries." | "…It's called the Sun Catcher." | The next page says the same thing. |
| M4 p6-chart | "A crescent. A half. A big bulgy one. And soon, a full Moon." | (cut) | Repeated the previous page almost word for word. |
| M4 p6-chart | "The Moon looks like it's growing… But it's the same Moon, all the time. We just see more of its sunny side." | "The Moon isn't really growing," said Button. "We just see more of its sunny side." | Shorter and clearer for a preschooler. |
| M4 end | "…And one big, bright, beautiful Moon, for everybody." | "…And one big, bright, beautiful Moon." | The new sharing page already ends with "One Moon, for everybody to share." |
| M6 p6-stars | "Outside the little window, the stars were shining." | "On the cabin wall, five little glow-in-the-dark stars were shining." | The picture shows glow-stars on the wall; the words must match what the child sees. |
| M1–M6 science lines (9 lines) | e.g. "make everything glow pink", "Solar panels need to face the Sun", "golden sparkles", "In about half an hour" | e.g. "make our garden glow pink", "work best when they face the Sun", "sparkles of gold and white", "Soon, in less than an hour" | Flagged by the sources research as slightly overstated; see docs/SCIENCE_SOURCES.md. |
| Titles | "One Window, Two Friends", "The Dark Side Noises" | "Turns at the Telescope", "Night-Side Noises" | Two children plus Button are three friends; "dark side" is tied to a film franchise. |

### Added, so every path runs at least 6 minutes on real audio

- M3: "Hmm," said Button. "Let's go and take a look." (tell path); the Sun slipping behind the Earth, and Tommy waving goodbye to it.
- M4: a new page where the crew shares the full Moon with Mission Control ("People all over the world can look up, and see the very same Moon.").
- M5: Button's flickering light when scared; a brave high-five from Tommy; "Just a fan, a spoon, and a water machine."; golden sunrise light filling the Cupola.

### Kept on purpose

- M1 "Our whole station is always falling around the Earth": the word "falling" is followed at once by "swooping around and around, and never landing", which keeps it gentle.
- M3 "Did I break my charger? Is it my fault?": this is the natural consequence of hiding the panel, and it is put right four lines later. It is the heart of the honesty story.
- M5 the three noises and Button being scared: the noises are soft, the children are never in danger, and each noise turns out to be friendly. The fear is Button's, and the children help.
- "Robots don't" appears in M1 and M2: a small running joke.

### Tommy's moments

`npm run check:story` fails if any stretch between two choices, on any path, has no Tommy "tap anything" moment. Every stretch of every path has at least one.

### Preachiness

No line states a moral. The closest are characters' own words ("Thank you for telling me", "I don't feel shy anymore", "Hiding didn't make it stop"), which describe what happened and how someone feels.
