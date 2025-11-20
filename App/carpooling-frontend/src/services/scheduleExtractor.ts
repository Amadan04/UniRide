/**
 * Class Schedule Extractor Service
 *
 * Uses OpenRouter API with vision model to extract class schedules from images
 * and process manual editing commands.
 */

export interface ClassBlock {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface WeeklySchedule {
  sunday: ClassBlock[];
  monday: ClassBlock[];
  tuesday: ClassBlock[];
  wednesday: ClassBlock[];
  thursday: ClassBlock[];
}

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You are the "Class Schedule Manager" for the UniCarpool app.

Your responsibilities:
1. Extract class schedules from a user-uploaded timetable image.
2. Accept manual add/edit/remove/replace commands from the user.
3. Merge the image data and manual edits into one final weekly schedule.
4. Output the final schedule in a strict, Firestore-ready JSON format.
5. This JSON will be shown on the user's "My Class Schedule" page AND used internally to generate ride-card tags:
   - "After Classes"
   - "Between Classes"
   - "Close to Class Time"
   - "Conflicts With Class"

------------------------------------------------------------
WHERE THE OUTPUT WILL BE USED
------------------------------------------------------------
1. The final JSON will be saved to Firestore under:
   user.classSchedule = { ... }
2. The "My Class Schedule" page will display this JSON to the user as:
   - Each day → list of class blocks
   - Empty days → "No classes"
3. The ride cards will use this JSON to label each ride with one of:
   - 🟢 After Classes
   - 🟡 Between Classes
   - 🟡 Close to Class Time
   - 🔴 Conflicts With Class

You MUST return JSON that is clean, normalized, and formatted exactly as required.

------------------------------------------------------------
YOUR TASKS (Detailed)
------------------------------------------------------------
1. **If the user uploads an image:**
   - Extract all class times accurately.
   - Support tables, lists, grids, rotated text, screenshots, and handwritten schedules.
   - Identify days Sunday–Thursday.
   - Extract all start/end times.
   - Ignore course names, codes, rooms, teachers, notes, decorations.

2. **If the user sends manual editing commands:**
   Examples you must fully understand:
   - "Add a class on Monday 9–11"
   - "Remove my Wednesday class at 10"
   - "Change Tuesday 8–9 to 8–10"
   - "Delete all classes from Sunday"
   - "Replace my Thursday schedule with 1–2 and 3–4"
   - "Add 4 PM to 5 PM class on Monday"
   - "Clear everything and set new classes: Mon 8–9, Tue 11–12"

   You must correctly interpret ALL natural-language edit requests.

3. **If BOTH image + manual edits are given:**
   - Extract schedule from image first.
   - Apply all user edit instructions second.
   - Produce the final merged schedule.

------------------------------------------------------------
TIME NORMALIZATION RULES (Strict)
------------------------------------------------------------
- Convert AM/PM → 24-hour format.
- Always output time as EXACTLY "HH:MM".
- Add leading zeros ("8:0" → "08:00").
- Fix incomplete times.
- Sort classes for each day chronologically.
- Ensure start < end always.
- If unclear, make your most reasonable interpretation.

------------------------------------------------------------
FINAL REQUIRED JSON FORMAT
------------------------------------------------------------
You must ALWAYS output JSON in this EXACT structure:

{
  "sunday": [
    { "start": "HH:MM", "end": "HH:MM" }
  ],
  "monday": [],
  "tuesday": [],
  "wednesday": [],
  "thursday": []
}

RULES:
- Days must always appear in this order.
- Only include Sunday → Thursday.
- If a day has no classes, return an empty array.
- Each class must contain ONLY:
  - "start"
  - "end"
- No extra fields (no name, no code, no room).
- No comments.
- No metadata.

------------------------------------------------------------
STRICT OUTPUT RULES
------------------------------------------------------------
You MUST:
- Output ONLY the JSON object.
- Not wrap JSON in backticks.
- Not include explanations.
- Not include markdown.
- Not include descriptions.
- Not mention images or edits.
- Not say "Here is your schedule."

Your output MUST be:
A single JSON object that will be shown on the Schedule Page and used for ride-card tag logic.

------------------------------------------------------------
When the user uploads an image or gives manual commands:
Extract → Apply → Merge → Output ONLY the final JSON.`;

/**
 * Convert image file to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract schedule from image using OpenRouter Vision API
 */
export async function extractScheduleFromImage(
  imageFile: File,
  editCommands?: string,
  currentSchedule?: WeeklySchedule
): Promise<WeeklySchedule> {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const base64Image = await fileToBase64(imageFile);

    let userMessage = 'Extract the class schedule from this timetable image.';

    if (currentSchedule && editCommands) {
      userMessage = `Current schedule: ${JSON.stringify(currentSchedule)}\n\nImage: Extract schedule from this image.\n\nThen apply these edits: ${editCommands}`;
    } else if (editCommands) {
      userMessage = `Extract schedule from this image and apply these edits: ${editCommands}`;
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'UniCarpool Schedule Extractor'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userMessage
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const jsonResponse = data.choices[0]?.message?.content || '{}';

    // Parse the JSON response
    const schedule = JSON.parse(jsonResponse.trim());
    return validateSchedule(schedule);
  } catch (error) {
    console.error('Schedule extraction error:', error);
    throw error;
  }
}

/**
 * Process manual editing commands without image
 */
export async function processScheduleEdits(
  editCommands: string,
  currentSchedule: WeeklySchedule
): Promise<WeeklySchedule> {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const userMessage = `Current schedule: ${JSON.stringify(currentSchedule)}\n\nApply these edits: ${editCommands}`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'UniCarpool Schedule Editor'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const jsonResponse = data.choices[0]?.message?.content || '{}';

    // Parse the JSON response
    const schedule = JSON.parse(jsonResponse.trim());
    return validateSchedule(schedule);
  } catch (error) {
    console.error('Schedule edit error:', error);
    throw error;
  }
}

/**
 * Validate and normalize schedule
 */
function validateSchedule(schedule: any): WeeklySchedule {
  const normalized: WeeklySchedule = {
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: []
  };

  const days: (keyof WeeklySchedule)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

  for (const day of days) {
    if (schedule[day] && Array.isArray(schedule[day])) {
      normalized[day] = schedule[day]
        .filter((block: any) => block.start && block.end)
        .map((block: any) => ({
          start: normalizeTime(block.start),
          end: normalizeTime(block.end)
        }))
        .sort((a: ClassBlock, b: ClassBlock) =>
          a.start.localeCompare(b.start)
        );
    }
  }

  return normalized;
}

/**
 * Normalize time to HH:MM format
 */
function normalizeTime(time: string): string {
  // Remove spaces
  time = time.trim();

  // If already in HH:MM format, validate and return
  const hhmmMatch = time.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    const hour = hhmmMatch[1].padStart(2, '0');
    const minute = hhmmMatch[2];
    return `${hour}:${minute}`;
  }

  // Handle H:M format
  const hmMatch = time.match(/^(\d{1,2}):(\d{1,2})$/);
  if (hmMatch) {
    const hour = hmMatch[1].padStart(2, '0');
    const minute = hmMatch[2].padStart(2, '0');
    return `${hour}:${minute}`;
  }

  // Handle just hour (8 -> 08:00)
  const hourMatch = time.match(/^(\d{1,2})$/);
  if (hourMatch) {
    const hour = hourMatch[1].padStart(2, '0');
    return `${hour}:00`;
  }

  // Default fallback
  return '00:00';
}

/**
 * Get empty schedule
 */
export function getEmptySchedule(): WeeklySchedule {
  return {
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: []
  };
}

/**
 * Check if ride conflicts with class schedule
 */
export function checkRideConflict(
  rideTime: string, // HH:MM
  rideDay: string,  // lowercase day name
  schedule: WeeklySchedule
): 'conflicts' | 'close' | 'between' | 'after' {
  const daySchedule = schedule[rideDay as keyof WeeklySchedule] || [];

  if (daySchedule.length === 0) {
    return 'after'; // No classes this day
  }

  const rideMinutes = timeToMinutes(rideTime);

  for (const classBlock of daySchedule) {
    const classStart = timeToMinutes(classBlock.start);
    const classEnd = timeToMinutes(classBlock.end);

    // Direct conflict
    if (rideMinutes >= classStart && rideMinutes <= classEnd) {
      return 'conflicts';
    }

    // Close to class (within 30 minutes before)
    if (rideMinutes >= classStart - 30 && rideMinutes < classStart) {
      return 'close';
    }
  }

  // Check if between classes
  for (let i = 0; i < daySchedule.length - 1; i++) {
    const currentEnd = timeToMinutes(daySchedule[i].end);
    const nextStart = timeToMinutes(daySchedule[i + 1].start);

    if (rideMinutes > currentEnd && rideMinutes < nextStart) {
      return 'between';
    }
  }

  // After all classes
  const lastClass = daySchedule[daySchedule.length - 1];
  if (rideMinutes > timeToMinutes(lastClass.end)) {
    return 'after';
  }

  return 'after';
}

/**
 * Convert HH:MM to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}