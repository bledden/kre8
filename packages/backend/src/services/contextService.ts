import axios, { AxiosError } from 'axios';
import { getModelForTask } from './aiService.js';

// =============================================================================
// Context-Aware Music Generation Service
// Uses Grok's tool calling to gather context, with actual tool execution
// =============================================================================

const getApiKey = () => process.env.XAI_API_KEY;
const getWeatherApiKey = () => process.env.OPENWEATHER_API_KEY;
const XAI_BASE_URL = 'https://api.x.ai/v1/chat/completions';

/**
 * Tools available for context gathering
 */
const CONTEXT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_weather',
      description: 'Get current weather conditions for a location. Returns temperature, conditions (sunny, cloudy, rainy, stormy, snowy), wind speed, humidity, and whether it is windy or humid.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name or "lat,lon" coordinates',
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_time_context',
      description: 'Get time-of-day context for music generation. Returns time period (morning, midday, afternoon, evening, night, late night) and energy recommendations.',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: 'IANA timezone string (e.g., "America/New_York")',
          },
          localTime: {
            type: 'string',
            description: 'Local time string (e.g., "3:45 PM")',
          },
        },
        required: [],
      },
    },
  },
];

/**
 * System prompt for context-aware music generation
 */
const CONTEXT_SYSTEM_PROMPT = `You are helping create personalized music with Strudel live coding. You have tools to gather context about the user's environment.

Available tools:
- get_weather: Get current weather (temperature, conditions, wind, humidity)
- get_time_context: Get time-of-day context (morning, afternoon, evening, night, etc.)

WHEN TO USE TOOLS:
- If user context includes location → use get_weather to get actual conditions
- If user context includes time → use get_time_context to categorize the time period
- If request mentions weather, mood, environment, vibe, atmosphere → use both tools
- If it's a simple direct genre request ("make a techno beat") → skip tools, respond directly

After gathering context, synthesize it into specific musical recommendations:
- Weather conditions (sunny/cloudy/rainy/stormy/snowy/windy/humid) → affects mood, tempo, effects
- Time of day → affects energy level, brightness, atmosphere
- Location type (urban/coastal/mountain/suburban/park) → affects style and instruments

Respond with a concise summary of the context and specific musical direction.`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface GrokResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
}

export interface ContextRequest {
  prompt: string;
  location?: {
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  timezone?: string;
  localTime?: string;
}

export interface ContextResult {
  originalPrompt: string;
  contextGathered: boolean;
  toolsUsed: string[];
  contextSummary: string | null;
  musicalRecommendations: {
    timeOfDay?: string;
    weather?: string;
    locationType?: string;
    mood?: string;
    tempo?: string;
    energy?: string;
    isWindy?: boolean;
    isHumid?: boolean;
  };
  enhancedPrompt: string;
}

// =============================================================================
// Tool Execution Functions
// =============================================================================

interface WeatherData {
  temperature: number;
  temperatureF: number;
  conditions: string;
  description: string;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  cloudCover: number;
  isWindy: boolean;
  isHumid: boolean;
  feelsLike: number;
}

/**
 * Execute get_weather tool - fetches real weather data from OpenWeatherMap
 */
async function executeGetWeather(location: string, coordinates?: { lat: number; lng: number }): Promise<string> {
  const apiKey = getWeatherApiKey();

  // If no API key, return a reasonable default
  if (!apiKey) {
    console.log('[Context] No OPENWEATHER_API_KEY configured, returning neutral weather');
    return JSON.stringify({
      conditions: 'Clear',
      description: 'Weather data unavailable - using neutral defaults',
      temperature: 70,
      temperatureF: 70,
      humidity: 50,
      windSpeed: 5,
      windDirection: 'N',
      isWindy: false,
      isHumid: false,
      feelsLike: 70,
      note: 'Add OPENWEATHER_API_KEY to .env for real weather data',
    });
  }

  try {
    let url: string;
    if (coordinates) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${apiKey}&units=imperial`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=imperial`;
    }

    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    const windSpeed = Math.round(data.wind?.speed || 0);
    const humidity = data.main.humidity;

    const weather: WeatherData = {
      temperature: Math.round(data.main.temp),
      temperatureF: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      conditions: mapWeatherCondition(data.weather[0].main, data.weather[0].id),
      description: data.weather[0].description,
      windSpeed,
      windDirection: getWindDirection(data.wind?.deg),
      humidity,
      cloudCover: data.clouds?.all || 0,
      isWindy: windSpeed > 15, // >15 mph is windy
      isHumid: humidity > 70, // >70% is humid
    };

    console.log('[Context] Weather fetched:', weather.conditions, `${weather.temperature}°F`,
      weather.isWindy ? '(windy)' : '', weather.isHumid ? '(humid)' : '');
    return JSON.stringify(weather);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Context] Weather API error:', axiosError.message);
    return JSON.stringify({
      conditions: 'Unknown',
      description: 'Could not fetch weather data',
      temperature: 70,
      humidity: 50,
      windSpeed: 5,
      isWindy: false,
      isHumid: false,
      error: true,
    });
  }
}

/**
 * Map OpenWeatherMap condition codes to our categories
 */
function mapWeatherCondition(main: string, id: number): string {
  // Thunderstorm group (2xx)
  if (id >= 200 && id < 300) return 'Stormy';

  // Drizzle and Rain (3xx, 5xx)
  if ((id >= 300 && id < 400) || (id >= 500 && id < 600)) return 'Rainy';

  // Snow (6xx)
  if (id >= 600 && id < 700) return 'Snowy';

  // Atmosphere (fog, mist, etc) (7xx)
  if (id >= 700 && id < 800) return 'Cloudy';

  // Clear (800)
  if (id === 800) return 'Sunny';

  // Clouds (80x)
  if (id > 800) return 'Cloudy';

  // Fallback based on main
  const mainLower = main.toLowerCase();
  if (mainLower.includes('thunder') || mainLower.includes('storm')) return 'Stormy';
  if (mainLower.includes('rain') || mainLower.includes('drizzle')) return 'Rainy';
  if (mainLower.includes('snow')) return 'Snowy';
  if (mainLower.includes('cloud')) return 'Cloudy';
  if (mainLower.includes('clear') || mainLower.includes('sun')) return 'Sunny';

  return 'Clear';
}

function getWindDirection(degrees?: number): string {
  if (degrees === undefined) return 'N/A';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Execute get_time_context tool
 */
function executeGetTimeContext(localTime?: string, timezone?: string): string {
  let hour: number;

  if (localTime) {
    const match12h = localTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    const match24h = localTime.match(/(\d{1,2}):(\d{2})/);

    if (match12h) {
      hour = parseInt(match12h[1]);
      const isPM = match12h[3].toUpperCase() === 'PM';
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
    } else if (match24h) {
      hour = parseInt(match24h[1]);
    } else {
      hour = new Date().getHours();
    }
  } else {
    hour = new Date().getHours();
  }

  let period: string;
  let energy: string;
  let brightness: string;
  let suggestedTempo: string;

  if (hour >= 5 && hour < 10) {
    period = 'Morning (5am-10am)';
    energy = 'Rising, optimistic';
    brightness = 'Bright, clean';
    suggestedTempo = '90-120 BPM';
  } else if (hour >= 10 && hour < 14) {
    period = 'Midday (10am-2pm)';
    energy = 'Peak, confident';
    brightness = 'Full, present';
    suggestedTempo = '110-130 BPM';
  } else if (hour >= 14 && hour < 18) {
    period = 'Afternoon (2pm-6pm)';
    energy = 'Sustained, mellowing';
    brightness = 'Warm';
    suggestedTempo = '100-125 BPM';
  } else if (hour >= 18 && hour < 22) {
    period = 'Evening (6pm-10pm)';
    energy = 'Winding down';
    brightness = 'Warmer, softer';
    suggestedTempo = '80-110 BPM';
  } else if (hour >= 22 || hour < 2) {
    period = 'Night (10pm-2am)';
    energy = 'Atmospheric, introspective';
    brightness = 'Dark, spacious';
    suggestedTempo = '70-100 BPM (or 120-140 for club)';
  } else {
    period = 'Late Night (2am-5am)';
    energy = 'Minimal, dreamlike';
    brightness = 'Very dark, ambient';
    suggestedTempo = '60-90 BPM';
  }

  return JSON.stringify({
    period,
    hour,
    energy,
    brightness,
    suggestedTempo,
    timezone: timezone || 'Unknown',
  });
}

/**
 * Determine location type from city name - expanded categories
 */
function getLocationType(city?: string, country?: string): string {
  if (!city && !country) return 'Urban/City';

  const location = `${city || ''} ${country || ''}`.toLowerCase();

  // Coastal indicators
  const coastalKeywords = ['beach', 'coast', 'bay', 'harbor', 'port', 'ocean', 'sea', 'island', 'shore', 'pier', 'marina'];
  const coastalCities = ['miami', 'san diego', 'santa monica', 'malibu', 'honolulu', 'sydney', 'barcelona', 'rio', 'cancun', 'bali', 'santa cruz', 'venice beach', 'key west', 'outer banks'];
  if (coastalKeywords.some(k => location.includes(k)) || coastalCities.some(c => location.includes(c))) {
    return 'Coastal/Beach';
  }

  // Mountain/Rural indicators
  const mountainKeywords = ['mountain', 'summit', 'peak', 'valley', 'ranch', 'farm', 'village', 'forest', 'woods', 'hills', 'highlands', 'rural', 'countryside'];
  const mountainCities = ['denver', 'boulder', 'aspen', 'salt lake', 'zurich', 'innsbruck', 'vail', 'telluride', 'jackson hole', 'lake tahoe'];
  if (mountainKeywords.some(k => location.includes(k)) || mountainCities.some(c => location.includes(c))) {
    return 'Mountains/Rural';
  }

  // Desert indicators
  const desertKeywords = ['desert', 'oasis', 'canyon', 'mesa', 'dunes', 'arid'];
  const desertCities = ['phoenix', 'tucson', 'las vegas', 'dubai', 'marrakech', 'cairo', 'scottsdale', 'sedona', 'palm springs', 'death valley'];
  if (desertKeywords.some(k => location.includes(k)) || desertCities.some(c => location.includes(c))) {
    return 'Desert/Arid';
  }

  // Park/Nature Area indicators
  const parkKeywords = ['park', 'garden', 'reserve', 'sanctuary', 'trail', 'nature', 'wilderness', 'national', 'state park', 'preserve', 'botanical'];
  if (parkKeywords.some(k => location.includes(k))) {
    return 'Park/Nature Area';
  }

  // Suburban/Residential indicators
  const suburbanKeywords = ['suburb', 'township', 'heights', 'grove', 'estates', 'meadows', 'springs', 'acres', 'terrace', 'residential', 'neighborhood'];
  if (suburbanKeywords.some(k => location.includes(k))) {
    return 'Suburban/Residential';
  }

  // Default to Urban for most cities
  return 'Urban/City';
}

/**
 * Execute a tool call and return the result
 */
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  request: ContextRequest
): Promise<string> {
  switch (toolName) {
    case 'get_weather':
      const location = (args.location as string) || request.location?.city || 'New York';
      return executeGetWeather(location, request.location?.coordinates);

    case 'get_time_context':
      return executeGetTimeContext(
        (args.localTime as string) || request.localTime,
        (args.timezone as string) || request.timezone
      );

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// =============================================================================
// Main Context Gathering Function
// =============================================================================

/**
 * Gather context for music generation using Grok's tool calling
 * with actual tool execution via weather API
 */
export async function gatherContext(request: ContextRequest): Promise<ContextResult> {
  const apiKey = getApiKey();

  // Build initial context hints for Grok
  const contextHints: string[] = [];
  if (request.location?.city) {
    contextHints.push(`Location: ${request.location.city}${request.location.country ? `, ${request.location.country}` : ''}`);
  }
  if (request.localTime) {
    contextHints.push(`Local time: ${request.localTime}`);
  }
  if (request.timezone) {
    contextHints.push(`Timezone: ${request.timezone}`);
  }

  // If no xAI API key or no user context, use direct injection (fallback)
  if (!apiKey || contextHints.length === 0) {
    return buildDirectContextResult(request);
  }

  const userMessage = `[User context: ${contextHints.join('; ')}]\n\nUser request: ${request.prompt}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: CONTEXT_SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ];

  try {
    const model = getModelForTask('context');

    // First call - let Grok decide if it needs tools
    const response1 = await axios.post<GrokResponse>(
      XAI_BASE_URL,
      {
        model,
        messages,
        tools: CONTEXT_TOOLS,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const choice1 = response1.data.choices[0];
    const toolsUsed: string[] = [];
    let weatherData: WeatherData | null = null;

    // If Grok wants to use tools, execute them
    if (choice1.message.tool_calls && choice1.message.tool_calls.length > 0) {
      // Add assistant's tool call message
      messages.push({
        role: 'assistant',
        content: choice1.message.content,
        tool_calls: choice1.message.tool_calls,
      });

      // Execute each tool and add results
      for (const toolCall of choice1.message.tool_calls) {
        toolsUsed.push(toolCall.function.name);

        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {
          args = {};
        }

        const result = await executeTool(toolCall.function.name, args, request);

        // Parse weather data if this was a weather call
        if (toolCall.function.name === 'get_weather') {
          try {
            weatherData = JSON.parse(result);
          } catch {
            // ignore parse errors
          }
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });

        console.log(`[Context] Executed ${toolCall.function.name}:`, result.substring(0, 100));
      }

      // Second call - get Grok's response with the tool results
      const response2 = await axios.post<GrokResponse>(
        XAI_BASE_URL,
        {
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const contextSummary = response2.data.choices[0].message.content || '';
      const recommendations = parseMusicalRecommendations(contextSummary, request, weatherData);

      return {
        originalPrompt: request.prompt,
        contextGathered: true,
        toolsUsed,
        contextSummary,
        musicalRecommendations: recommendations,
        enhancedPrompt: buildEnhancedPrompt(request.prompt, recommendations, contextSummary),
      };
    }

    // No tool calls - Grok responded directly (simple request)
    const directResponse = choice1.message.content || '';
    return {
      originalPrompt: request.prompt,
      contextGathered: false,
      toolsUsed: [],
      contextSummary: directResponse || null,
      musicalRecommendations: {},
      enhancedPrompt: request.prompt,
    };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const message = axiosError.response?.data?.error?.message || axiosError.message;
      console.error('[Context] API error:', message);
    } else {
      console.error('[Context] Error:', error);
    }

    // Fallback to direct context injection
    return buildDirectContextResult(request);
  }
}

/**
 * Build context result without xAI API calls (fallback)
 * Still works when user doesn't grant location permissions - just uses time
 */
function buildDirectContextResult(request: ContextRequest): ContextResult {
  const parts: string[] = [];

  // Time context - ALWAYS available (from browser)
  const timeContext = JSON.parse(executeGetTimeContext(request.localTime, request.timezone));
  parts.push(`**Time of Day:** ${timeContext.period}`);
  parts.push(`**Energy:** ${timeContext.energy}`);
  parts.push(`**Suggested Tempo:** ${timeContext.suggestedTempo}`);

  // Location context - only if user granted permission
  let locationType = 'Urban/City';
  if (request.location?.city) {
    locationType = getLocationType(request.location.city, request.location.country);
    parts.push(`**Location:** ${request.location.city}${request.location.country ? `, ${request.location.country}` : ''}`);
    parts.push(`**Location Type:** ${locationType}`);
  }

  const hasContext = parts.length > 0;
  const contextBlock = hasContext
    ? `## USER CONTEXT (Apply context-aware generation rules!)\n\n${parts.join('\n')}\n\nUse the CONTEXT-AWARE GENERATION rules to adapt the music. Time and location should influence tempo, scales, effects, and mood.\n\n---\n\n`
    : '';

  return {
    originalPrompt: request.prompt,
    contextGathered: hasContext,
    toolsUsed: [],
    contextSummary: `Time: ${timeContext.period}${request.location?.city ? `, Location: ${request.location.city} (${locationType})` : ''}`,
    musicalRecommendations: {
      timeOfDay: timeContext.period,
      energy: timeContext.energy,
      locationType: request.location?.city ? locationType : undefined,
    },
    enhancedPrompt: hasContext ? `${contextBlock}User request: ${request.prompt}` : request.prompt,
  };
}

/**
 * Parse Grok's response for musical recommendations
 */
function parseMusicalRecommendations(
  content: string,
  request: ContextRequest,
  weatherData: WeatherData | null
): ContextResult['musicalRecommendations'] {
  const recommendations: ContextResult['musicalRecommendations'] = {};

  // Extract time of day
  const timeMatch = content.match(/(?:time|period)[:\s]+([^,.\n]+)/i);
  if (timeMatch) recommendations.timeOfDay = timeMatch[1].trim();

  // Extract weather
  if (weatherData) {
    recommendations.weather = weatherData.conditions;
    recommendations.isWindy = weatherData.isWindy;
    recommendations.isHumid = weatherData.isHumid;
  } else {
    const weatherMatch = content.match(/(?:weather|conditions?)[:\s]+([^,.\n]+)/i);
    if (weatherMatch) recommendations.weather = weatherMatch[1].trim();
  }

  // Extract mood
  const moodMatch = content.match(/mood[:\s]+([^,.\n]+)/i);
  if (moodMatch) recommendations.mood = moodMatch[1].trim();

  // Extract tempo
  const tempoMatch = content.match(/tempo[:\s]+([^,.\n]+)/i);
  if (tempoMatch) recommendations.tempo = tempoMatch[1].trim();

  // Extract energy
  const energyMatch = content.match(/energy[:\s]+([^,.\n]+)/i);
  if (energyMatch) recommendations.energy = energyMatch[1].trim();

  // Add location type
  recommendations.locationType = getLocationType(request.location?.city, request.location?.country);

  return recommendations;
}

/**
 * Build enhanced prompt with context
 */
function buildEnhancedPrompt(
  originalPrompt: string,
  recommendations: ContextResult['musicalRecommendations'],
  contextSummary: string | null
): string {
  const parts: string[] = [];

  parts.push('## USER CONTEXT (Apply context-aware generation rules!)\n');

  if (contextSummary) {
    parts.push(contextSummary);
    parts.push('');
  }

  const recParts: string[] = [];
  if (recommendations.timeOfDay) recParts.push(`Time: ${recommendations.timeOfDay}`);
  if (recommendations.weather) {
    let weatherStr = `Weather: ${recommendations.weather}`;
    if (recommendations.isWindy) weatherStr += ' (windy)';
    if (recommendations.isHumid) weatherStr += ' (humid)';
    recParts.push(weatherStr);
  }
  if (recommendations.locationType) recParts.push(`Location type: ${recommendations.locationType}`);
  if (recommendations.mood) recParts.push(`Mood: ${recommendations.mood}`);
  if (recommendations.tempo) recParts.push(`Suggested tempo: ${recommendations.tempo}`);
  if (recommendations.energy) recParts.push(`Energy: ${recommendations.energy}`);

  if (recParts.length > 0) {
    parts.push(`**Musical direction:** ${recParts.join('; ')}`);
  }

  parts.push('\n---\n');
  parts.push(`User request: ${originalPrompt}`);

  return parts.join('\n');
}
