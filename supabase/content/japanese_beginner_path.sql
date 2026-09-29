-- Japanese beginner path: 6 units, 12 lessons, 60 playable exercises.
-- Run this entire file once in Supabase SQL Editor as the project owner.
-- Requires the four 20260928 schema migrations.
-- Saved grading/progress also requires 20260929000100_live_platform.sql.
-- This is an introductory path, not a full A1 proficiency certification.
-- Rerunning fills missing records; it does not overwrite later content edits.
begin;

do $create_path$
declare
  japanese_id uuid;
  path_id uuid;
  unit_id_value uuid;
  lesson_id_value uuid;
  exercise_id_value uuid;
  unit_data jsonb;
  lesson_data jsonb;
  exercise_data jsonb;
  unit_position integer := 0;
  lesson_position integer;
  exercise_position integer;
  path_data jsonb := $curriculum$
[
  {
    "title": "1. Greetings and courtesy",
    "lessons": [
      {
        "title": "Hello and goodbye",
        "exercises": [
          {
            "type": "multiple_choice",
            "prompt": "おはようございます (ohayou gozaimasu) is a polite morning greeting. What does it mean?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "Good night"
                },
                {
                  "id": "b",
                  "text": "Good morning"
                },
                {
                  "id": "c",
                  "text": "Goodbye"
                }
              ]
            },
            "solution": {
              "answer": "b"
            },
            "explanation": "おはようございます means good morning. The shorter おはよう is more casual."
          },
          {
            "type": "multiple_choice",
            "prompt": "You meet someone during the day. Which expression means hello?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "こんにちは"
                },
                {
                  "id": "b",
                  "text": "おやすみなさい"
                },
                {
                  "id": "c",
                  "text": "さようなら"
                }
              ]
            },
            "solution": {
              "answer": "a"
            },
            "explanation": "こんにちは (konnichiwa) is a daytime greeting. Its final は is pronounced wa."
          },
          {
            "type": "typing",
            "prompt": "Write the daytime greeting “hello” in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "こんにちは",
                "konnichiwa"
              ]
            },
            "explanation": "こんにちは is written with は at the end, although it is pronounced konnichiwa."
          },
          {
            "type": "typing",
            "prompt": "さようなら means goodbye. Copy it in hiragana, or write sayounara in romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "さようなら",
                "sayounara",
                "sayonara"
              ]
            },
            "explanation": "さようなら means goodbye; other expressions are often used for a casual see you later."
          },
          {
            "type": "word_order",
            "prompt": "Build the polite “thank you”: arigatou gozaimasu.",
            "payload": {
              "tokens": [
                "ございます",
                "ありがとう"
              ]
            },
            "solution": {
              "answer": [
                "ありがとう",
                "ございます"
              ]
            },
            "explanation": "ありがとうございます is a polite way to thank someone."
          }
        ]
      },
      {
        "title": "Polite everyday expressions",
        "exercises": [
          {
            "type": "multiple_choice",
            "prompt": "すみません (sumimasen) can get someone's attention politely. Choose the matching expression.",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "Excuse me"
                },
                {
                  "id": "b",
                  "text": "Good evening"
                },
                {
                  "id": "c",
                  "text": "I am a student"
                }
              ]
            },
            "solution": {
              "answer": "a"
            },
            "explanation": "すみません can mean excuse me or express an apology, depending on context."
          },
          {
            "type": "multiple_choice",
            "prompt": "A host offers you a seat and says どうぞ (douzo). What does this mean here?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "No, thank you"
                },
                {
                  "id": "b",
                  "text": "Please, go ahead"
                },
                {
                  "id": "c",
                  "text": "Good night"
                }
              ]
            },
            "solution": {
              "answer": "b"
            },
            "explanation": "どうぞ invites someone to take something or proceed."
          },
          {
            "type": "typing",
            "prompt": "Write “excuse me” in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "すみません",
                "sumimasen"
              ]
            },
            "explanation": "Use すみません to politely get someone's attention."
          },
          {
            "type": "typing",
            "prompt": "おねがいします (onegaishimasu) is a polite request expression. Copy it in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "おねがいします",
                "お願いします",
                "onegaishimasu",
                "onegai shimasu"
              ]
            },
            "explanation": "お願いします is used when making a request. おねがいします is the all-hiragana spelling."
          },
          {
            "type": "word_order",
            "prompt": "Build “This way, please.” Use こちら (this way), へ (toward), then どうぞ (please).",
            "payload": {
              "tokens": [
                "どうぞ",
                "こちら",
                "へ"
              ]
            },
            "solution": {
              "answer": [
                "こちら",
                "へ",
                "どうぞ"
              ]
            },
            "explanation": "こちらへどうぞ means this way, please. The particle へ is pronounced e."
          }
        ]
      }
    ]
  },
  {
    "title": "2. First hiragana",
    "lessons": [
      {
        "title": "The five vowel sounds",
        "exercises": [
          {
            "type": "multiple_choice",
            "prompt": "Hiragana represents sounds. あ is read a. Which character is a?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "い"
                },
                {
                  "id": "b",
                  "text": "あ"
                },
                {
                  "id": "c",
                  "text": "う"
                }
              ]
            },
            "solution": {
              "answer": "b"
            },
            "explanation": "The basic vowel sequence is あ a, い i, う u, え e, お o."
          },
          {
            "type": "multiple_choice",
            "prompt": "Which hiragana character represents the sound i?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "お"
                },
                {
                  "id": "b",
                  "text": "え"
                },
                {
                  "id": "c",
                  "text": "い"
                }
              ]
            },
            "solution": {
              "answer": "c"
            },
            "explanation": "い represents i. Compare あ a and う u."
          },
          {
            "type": "typing",
            "prompt": "Read う. Type its sound using romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "u"
              ]
            },
            "explanation": "う represents u."
          },
          {
            "type": "typing",
            "prompt": "Read え. Type its sound using romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "e"
              ]
            },
            "explanation": "え represents e."
          },
          {
            "type": "word_order",
            "prompt": "Arrange the five hiragana vowels in the standard order: a, i, u, e, o.",
            "payload": {
              "tokens": [
                "お",
                "う",
                "あ",
                "え",
                "い"
              ]
            },
            "solution": {
              "answer": [
                "あ",
                "い",
                "う",
                "え",
                "お"
              ]
            },
            "explanation": "The standard vowel order is あ・い・う・え・お."
          }
        ]
      },
      {
        "title": "Reading short kana words",
        "exercises": [
          {
            "type": "multiple_choice",
            "prompt": "か is ka and さ is sa. How do you read かさ (umbrella)?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "saka"
                },
                {
                  "id": "b",
                  "text": "kasa"
                },
                {
                  "id": "c",
                  "text": "kusa"
                }
              ]
            },
            "solution": {
              "answer": "b"
            },
            "explanation": "かさ is kasa: umbrella."
          },
          {
            "type": "multiple_choice",
            "prompt": "す is su and し is shi. Which reading matches すし?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "sushi"
                },
                {
                  "id": "b",
                  "text": "sasu"
                },
                {
                  "id": "c",
                  "text": "shisu"
                }
              ]
            },
            "solution": {
              "answer": "a"
            },
            "explanation": "すし is sushi. し is read shi in the romanization used here."
          },
          {
            "type": "typing",
            "prompt": "Read か. Type its sound in romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "ka"
              ]
            },
            "explanation": "か represents ka."
          },
          {
            "type": "typing",
            "prompt": "Read し. Type its sound in romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "shi"
              ]
            },
            "explanation": "し is read shi."
          },
          {
            "type": "word_order",
            "prompt": "Build the hiragana word kasa, meaning umbrella: ka followed by sa.",
            "payload": {
              "tokens": [
                "さ",
                "か"
              ]
            },
            "solution": {
              "answer": [
                "か",
                "さ"
              ]
            },
            "explanation": "か + さ makes かさ, umbrella."
          }
        ]
      }
    ]
  },
  {
    "title": "3. Introducing yourself",
    "lessons": [
      {
        "title": "Names and identity",
        "exercises": [
          {
            "type": "multiple_choice",
            "prompt": "はじめまして (hajimemashite) is used when first meeting someone. Choose its meaning.",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "See you tomorrow"
                },
                {
                  "id": "b",
                  "text": "Nice to meet you"
                },
                {
                  "id": "c",
                  "text": "Where is the station?"
                }
              ]
            },
            "solution": {
              "answer": "b"
            },
            "explanation": "はじめまして is an opening greeting at a first meeting."
          },
          {
            "type": "multiple_choice",
            "prompt": "わたしはアキです means “I am Aki.” Which word means I?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "です"
                },
                {
                  "id": "b",
                  "text": "アキ"
                },
                {
                  "id": "c",
                  "text": "わたし"
                }
              ]
            },
            "solution": {
              "answer": "c"
            },
            "explanation": "わたし means I. は marks the topic, and です makes the statement polite."
          },
          {
            "type": "typing",
            "prompt": "Write “nice to meet you” in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "はじめまして",
                "hajimemashite"
              ]
            },
            "explanation": "はじめまして is used when introducing yourself for the first time."
          },
          {
            "type": "typing",
            "prompt": "Write the word “I” in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "わたし",
                "watashi"
              ]
            },
            "explanation": "わたし is a common word for I."
          },
          {
            "type": "word_order",
            "prompt": "Introduce yourself as Aki: “I am Aki.” Use わたし, the topic particle は, the name アキ, and です.",
            "payload": {
              "tokens": [
                "です",
                "アキ",
                "わたし",
                "は"
              ]
            },
            "solution": {
              "answer": [
                "わたし",
                "は",
                "アキ",
                "です"
              ]
            },
            "explanation": "わたしはアキです means I am Aki. The particle は is pronounced wa."
          }
        ]
      },
      {
        "title": "People and simple questions",
        "exercises": [
          {
            "type": "multiple_choice",
            "prompt": "がくせい (gakusei) means student. Which sentence says “I am a student”?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "わたしはがくせいです"
                },
                {
                  "id": "b",
                  "text": "これはほんです"
                },
                {
                  "id": "c",
                  "text": "えきはどこですか"
                }
              ]
            },
            "solution": {
              "answer": "a"
            },
            "explanation": "わたしはがくせいです means I am a student."
          },
          {
            "type": "multiple_choice",
            "prompt": "The particle か often ends polite questions. Choose “Are you a student?”",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "がくせいです"
                },
                {
                  "id": "b",
                  "text": "がくせいですか"
                },
                {
                  "id": "c",
                  "text": "がくせいではありません"
                }
              ]
            },
            "solution": {
              "answer": "b"
            },
            "explanation": "がくせいですか is a polite question: are you a student? The subject can be omitted in context."
          },
          {
            "type": "typing",
            "prompt": "Write “student” in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "がくせい",
                "gakusei"
              ]
            },
            "explanation": "学生 is read がくせい, gakusei."
          },
          {
            "type": "typing",
            "prompt": "せんせい (sensei) means teacher. Copy the word in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "せんせい",
                "sensei"
              ]
            },
            "explanation": "先生 is read せんせい, sensei."
          },
          {
            "type": "word_order",
            "prompt": "Ask “What is your name?” Use おなまえ (name), は, なん (what), です, and か.",
            "payload": {
              "tokens": [
                "か",
                "なん",
                "おなまえ",
                "です",
                "は"
              ]
            },
            "solution": {
              "answer": [
                "おなまえ",
                "は",
                "なん",
                "です",
                "か"
              ]
            },
            "explanation": "おなまえはなんですか means what is your name?"
          }
        ]
      }
    ]
  },
  {
    "title": "4. Numbers and everyday things",
    "lessons": [
      {
        "title": "Counting from one to five",
        "exercises": [
          {
            "type": "multiple_choice",
            "prompt": "いち (ichi) is one; に (ni) is two; さん (san) is three. Which is two?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "さん"
                },
                {
                  "id": "b",
                  "text": "に"
                },
                {
                  "id": "c",
                  "text": "いち"
                }
              ]
            },
            "solution": {
              "answer": "b"
            },
            "explanation": "に is two."
          },
          {
            "type": "multiple_choice",
            "prompt": "For this counting sequence, four is よん (yon) and five is ご (go). Which is five?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "ご"
                },
                {
                  "id": "b",
                  "text": "よん"
                },
                {
                  "id": "c",
                  "text": "さん"
                }
              ]
            },
            "solution": {
              "answer": "a"
            },
            "explanation": "ご is five. Four also has the reading し in some contexts."
          },
          {
            "type": "typing",
            "prompt": "Write the number one in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "いち",
                "ichi"
              ]
            },
            "explanation": "一 is read いち, ichi."
          },
          {
            "type": "typing",
            "prompt": "Write the number four using the reading yon, in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "よん",
                "yon"
              ]
            },
            "explanation": "よん is a common reading of 四, four."
          },
          {
            "type": "word_order",
            "prompt": "Count from one to five. Arrange the words in numerical order.",
            "payload": {
              "tokens": [
                "ご",
                "さん",
                "いち",
                "よん",
                "に"
              ]
            },
            "solution": {
              "answer": [
                "いち",
                "に",
                "さん",
                "よん",
                "ご"
              ]
            },
            "explanation": "いち、に、さん、よん、ご: one, two, three, four, five."
          }
        ]
      },
      {
        "title": "This is a book",
        "exercises": [
          {
            "type": "multiple_choice",
            "prompt": "これ (kore) means this thing near the speaker. What does これ refer to?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "That thing far away"
                },
                {
                  "id": "b",
                  "text": "This thing here"
                },
                {
                  "id": "c",
                  "text": "A person"
                }
              ]
            },
            "solution": {
              "answer": "b"
            },
            "explanation": "これ refers to a thing near the speaker."
          },
          {
            "type": "multiple_choice",
            "prompt": "ほん (hon) means book. Choose “This is a book.”",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "これはほんです"
                },
                {
                  "id": "b",
                  "text": "わたしはアキです"
                },
                {
                  "id": "c",
                  "text": "おなまえはなんですか"
                }
              ]
            },
            "solution": {
              "answer": "a"
            },
            "explanation": "これはほんです means this is a book."
          },
          {
            "type": "typing",
            "prompt": "Write “book” in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "ほん",
                "hon"
              ]
            },
            "explanation": "本 is read ほん, hon."
          },
          {
            "type": "typing",
            "prompt": "かばん (kaban) means bag. Copy it in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "かばん",
                "kaban"
              ]
            },
            "explanation": "かばん means bag."
          },
          {
            "type": "word_order",
            "prompt": "Build “This is a book.” Use これ, は, ほん, and です.",
            "payload": {
              "tokens": [
                "ほん",
                "です",
                "これ",
                "は"
              ]
            },
            "solution": {
              "answer": [
                "これ",
                "は",
                "ほん",
                "です"
              ]
            },
            "explanation": "これはほんです identifies the thing near the speaker as a book."
          }
        ]
      }
    ]
  },
  {
    "title": "5. At a café",
    "lessons": [
      {
        "title": "Asking for a drink",
        "exercises": [
          {
            "type": "multiple_choice",
            "prompt": "みず (mizu) means water. Which word means water?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "おちゃ"
                },
                {
                  "id": "b",
                  "text": "みず"
                },
                {
                  "id": "c",
                  "text": "ごはん"
                }
              ]
            },
            "solution": {
              "answer": "b"
            },
            "explanation": "みず means water. おちゃ is tea and ごはん is rice or a meal."
          },
          {
            "type": "multiple_choice",
            "prompt": "ください (kudasai) makes a request. What does みずをください mean?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "Where is the water?"
                },
                {
                  "id": "b",
                  "text": "This is water"
                },
                {
                  "id": "c",
                  "text": "Water, please"
                }
              ]
            },
            "solution": {
              "answer": "c"
            },
            "explanation": "みずをください means water, please. The particle を is pronounced o."
          },
          {
            "type": "typing",
            "prompt": "Write “water” in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "みず",
                "mizu"
              ]
            },
            "explanation": "水 is read みず, mizu."
          },
          {
            "type": "typing",
            "prompt": "おちゃ (ocha) means tea. Write tea in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "おちゃ",
                "ocha"
              ]
            },
            "explanation": "お茶 is read おちゃ, ocha."
          },
          {
            "type": "word_order",
            "prompt": "Ask for water: “Water, please.” Use みず, を, and ください.",
            "payload": {
              "tokens": [
                "ください",
                "みず",
                "を"
              ]
            },
            "solution": {
              "answer": [
                "みず",
                "を",
                "ください"
              ]
            },
            "explanation": "みずをください is a polite request for water."
          }
        ]
      },
      {
        "title": "Food and prices",
        "exercises": [
          {
            "type": "multiple_choice",
            "prompt": "ごはん (gohan) can mean cooked rice or a meal. Choose that word.",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "えき"
                },
                {
                  "id": "b",
                  "text": "ごはん"
                },
                {
                  "id": "c",
                  "text": "ほん"
                }
              ]
            },
            "solution": {
              "answer": "b"
            },
            "explanation": "ごはん means cooked rice and, depending on context, a meal."
          },
          {
            "type": "multiple_choice",
            "prompt": "いくら (ikura) asks about a price. What does これはいくらですか mean?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "How much is this?"
                },
                {
                  "id": "b",
                  "text": "What is your name?"
                },
                {
                  "id": "c",
                  "text": "Where is this?"
                }
              ]
            },
            "solution": {
              "answer": "a"
            },
            "explanation": "これはいくらですか asks the price of something near the speaker."
          },
          {
            "type": "typing",
            "prompt": "Write “rice / a meal” in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "ごはん",
                "gohan"
              ]
            },
            "explanation": "ごはん can refer to rice or a meal."
          },
          {
            "type": "typing",
            "prompt": "The Japanese word for yen is えん (en). Type it in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "えん",
                "en"
              ]
            },
            "explanation": "円 is read えん, en. It follows a number in a price."
          },
          {
            "type": "word_order",
            "prompt": "Ask “How much is this?” Use これ, は, いくら, です, and か.",
            "payload": {
              "tokens": [
                "いくら",
                "か",
                "これ",
                "です",
                "は"
              ]
            },
            "solution": {
              "answer": [
                "これ",
                "は",
                "いくら",
                "です",
                "か"
              ]
            },
            "explanation": "これはいくらですか is a useful question when shopping."
          }
        ]
      }
    ]
  },
  {
    "title": "6. Finding your way and review",
    "lessons": [
      {
        "title": "Where is the station?",
        "exercises": [
          {
            "type": "multiple_choice",
            "prompt": "えき (eki) means station. Which word means station?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "みず"
                },
                {
                  "id": "b",
                  "text": "えき"
                },
                {
                  "id": "c",
                  "text": "かばん"
                }
              ]
            },
            "solution": {
              "answer": "b"
            },
            "explanation": "駅 is read えき, eki."
          },
          {
            "type": "multiple_choice",
            "prompt": "どこ (doko) asks about a place. What does えきはどこですか mean?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "The station is here"
                },
                {
                  "id": "b",
                  "text": "How much is the ticket?"
                },
                {
                  "id": "c",
                  "text": "Where is the station?"
                }
              ]
            },
            "solution": {
              "answer": "c"
            },
            "explanation": "えきはどこですか means where is the station?"
          },
          {
            "type": "typing",
            "prompt": "みぎ (migi) means right. Type the direction right in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "みぎ",
                "migi"
              ]
            },
            "explanation": "右 is read みぎ, migi."
          },
          {
            "type": "typing",
            "prompt": "ひだり (hidari) means left. Type the direction left in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "ひだり",
                "hidari"
              ]
            },
            "explanation": "左 is read ひだり, hidari."
          },
          {
            "type": "word_order",
            "prompt": "Ask “Where is the station?” Use えき, は, どこ, です, and か.",
            "payload": {
              "tokens": [
                "です",
                "どこ",
                "えき",
                "か",
                "は"
              ]
            },
            "solution": {
              "answer": [
                "えき",
                "は",
                "どこ",
                "です",
                "か"
              ]
            },
            "explanation": "えきはどこですか asks for the station's location."
          }
        ]
      },
      {
        "title": "Your first Japanese conversation — review",
        "exercises": [
          {
            "type": "multiple_choice",
            "prompt": "You want to get someone's attention before asking for directions. Which phrase fits?",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "すみません"
                },
                {
                  "id": "b",
                  "text": "おやすみなさい"
                },
                {
                  "id": "c",
                  "text": "さようなら"
                }
              ]
            },
            "solution": {
              "answer": "a"
            },
            "explanation": "すみません is a polite way to get attention before a question."
          },
          {
            "type": "multiple_choice",
            "prompt": "Choose the request “Tea, please.”",
            "payload": {
              "options": [
                {
                  "id": "a",
                  "text": "これはほんです"
                },
                {
                  "id": "b",
                  "text": "おちゃをください"
                },
                {
                  "id": "c",
                  "text": "わたしはがくせいです"
                }
              ]
            },
            "solution": {
              "answer": "b"
            },
            "explanation": "おちゃをください follows the pattern: thing + を + ください."
          },
          {
            "type": "typing",
            "prompt": "Write “hello” as a daytime greeting in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "こんにちは",
                "konnichiwa"
              ]
            },
            "explanation": "こんにちは is the daytime greeting; remember that the final は is pronounced wa."
          },
          {
            "type": "typing",
            "prompt": "Write “station” in hiragana or romaji.",
            "payload": {
              "inputLanguage": "ja"
            },
            "solution": {
              "answers": [
                "えき",
                "eki"
              ]
            },
            "explanation": "駅 is read えき, eki."
          },
          {
            "type": "word_order",
            "prompt": "Finish your introduction: “I am Aki.” Arrange the words.",
            "payload": {
              "tokens": [
                "は",
                "アキ",
                "です",
                "わたし"
              ]
            },
            "solution": {
              "answer": [
                "わたし",
                "は",
                "アキ",
                "です"
              ]
            },
            "explanation": "わたしはアキです. You can now combine greetings, an introduction, a request, and a simple location question."
          }
        ]
      }
    ]
  }
]
$curriculum$::jsonb;
begin
  -- Reuse the existing language regardless of the UUID used when it was created.
  insert into public.languages(code,name,native_name,enabled)
    values('ja','Japanese','日本語',true)
    on conflict(code) do update set enabled=true
    returning id into japanese_id;

  insert into public.courses(language_id,slug,title,description,level,status)
    values(japanese_id,'japanese-beginner-learning-path-v1','Japanese: Your First Conversations',
      'Learn greetings, first hiragana, introductions, numbers, café requests, and directions. Twelve short lessons combine explanations, choices, typing, and sentence building. Typing tasks accept the stated hiragana or romaji forms.',
      'A1','published')
    on conflict(slug) do nothing;

  select id into path_id from public.courses where slug='japanese-beginner-learning-path-v1';
  if not exists(select 1 from public.courses where id=path_id and language_id=japanese_id) then
    raise exception 'This course slug already belongs to another language. No changes were saved.';
  end if;

  for unit_data in select value from jsonb_array_elements(path_data) loop
    unit_position := unit_position+1;
    insert into public.units(course_id,title,position,status)
      values(path_id,unit_data->>'title',unit_position,'published')
      on conflict(course_id,position) do nothing;
    select id into unit_id_value from public.units where course_id=path_id and position=unit_position;

    lesson_position := 0;
    for lesson_data in select value from jsonb_array_elements(unit_data->'lessons') loop
      lesson_position := lesson_position+1;
      insert into public.lessons(unit_id,title,position,content_version,estimated_minutes,xp_reward,status)
        values(unit_id_value,lesson_data->>'title',lesson_position,1,5,30,'published')
        on conflict(unit_id,position) do nothing;
      select id into lesson_id_value from public.lessons where unit_id=unit_id_value and position=lesson_position;

      exercise_position := 0;
      for exercise_data in select value from jsonb_array_elements(lesson_data->'exercises') loop
        exercise_position := exercise_position+1;
        insert into public.exercises(lesson_id,position,type,schema_version,prompt,payload,status)
          values(lesson_id_value,exercise_position,exercise_data->>'type',1,
            exercise_data->>'prompt',exercise_data->'payload','published')
          on conflict(lesson_id,position) do nothing
          returning id into exercise_id_value;
        -- Only attach an answer to an exercise inserted by this execution.
        -- Preserve both prompt and answer if an administrator has edited it.
        if exercise_id_value is not null then
          insert into private.exercise_solutions(exercise_id,solution,explanation)
            values(exercise_id_value,exercise_data->'solution',exercise_data->>'explanation');
        end if;
      end loop;
    end loop;
  end loop;
end
$create_path$;

commit;

-- Expected for a new import: 6 units, 12 lessons, 60 exercises, 60 private keys.
-- Copy course_url into your local site's address bar after the hostname.
select c.title,c.status,
  count(distinct u.id) as units,
  count(distinct l.id) as lessons,
  count(distinct e.id) as exercises,
  count(distinct s.exercise_id) as private_answer_keys,
  '/app/course/'||c.id as course_url
from public.courses c
left join public.units u on u.course_id=c.id
left join public.lessons l on l.unit_id=u.id
left join public.exercises e on e.lesson_id=l.id
left join private.exercise_solutions s on s.exercise_id=e.id
where c.slug='japanese-beginner-learning-path-v1'
group by c.id;
