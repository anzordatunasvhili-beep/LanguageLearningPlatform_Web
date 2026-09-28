import { useId } from 'react';

export default function CharacterPortrait({
  appearance = {},
  name = 'Explorer',
  emotion = 'neutral',
}) {
  const gradientId = useId();
  const { skin = '#deb99e', hair = '#343735', outfit = '#747e69', style = 'bob' } = appearance;
  return (
    <svg
      className="character-portrait"
      viewBox="0 0 400 500"
      role="img"
      aria-label={`${name}, stylized placeholder character portrait`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={outfit} />
          <stop offset="1" stopColor="#292f2b" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="483" rx="132" ry="12" fill="#171e19" opacity=".15" />
      <path d="M132 165q-12-90 70-93 88-1 76 101l-8 103-141-2z" fill={hair} />
      <path d="m171 244-2 44-41 22 72 73 76-70-43-26-2-44" fill={skin} />
      <path d="M161 278q39 38 78 0l48 25-15 184H125l-19-171z" fill="#e3ddce" />
      <path
        d="m158 282-56 20q-31 13-40 56l-21 130h117l17-110-19-42 9-25zM243 282l56 22q31 14 38 58l22 126H238l-15-109 26-46-14-22z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="m158 283-18 59 22 8-15 20 23 58 5-49-19-43 10-24m77-29 18 59-21 8 15 20-25 58-4-49 23-43-14-24"
        fill="#fff"
        opacity=".14"
      />
      <path d="M146 164q-1-62 54-63 55 0 56 63l-4 46q-5 45-52 57-47-14-52-57z" fill={skin} />
      <path
        d="M135 167q-8-87 67-82 83-4 68 91l-24-31-4-23q-25 31-61 34l20-32q-28 27-66 43z"
        fill={hair}
      />
      {style === 'bob' && (
        <>
          <path d="m142 144-12 126 35-9-14-87zM254 142l17 128-36-11 14-87z" fill={hair} />
          <path d="m135 174-1 80 9-3-2-78z" fill="#fff" opacity=".05" />
        </>
      )}
      <path
        d="m164 181 18-3m35 0 18 3"
        stroke={hair}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M165 192q8-7 17 0m36 0q8-7 17 0"
        stroke="#343735"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="m198 198-3 17 8 1" stroke="#996a56" strokeWidth="2" fill="none" opacity=".6" />
      <path
        d={emotion === 'happy' ? 'M185 228q15 19 30 0z' : 'M188 230q12 8 24-1'}
        stroke="#986655"
        strokeWidth="2"
        fill={emotion === 'happy' ? '#faf0e3' : 'none'}
        strokeLinecap="round"
      />
      <ellipse cx="165" cy="215" rx="11" ry="5" fill="#bd7969" opacity=".2" />
      <ellipse cx="234" cy="215" rx="11" ry="5" fill="#bd7969" opacity=".2" />
      <path d="m201 304 0 91m-24-101 24 10 20-10" stroke="#c2baa8" fill="none" strokeWidth="2" />
      <circle cx="200" cy="318" r="3" fill="#b5a77c" />
      <path d="m76 403 65 4m120-1 64-3" stroke="#ffffff" opacity=".15" strokeWidth="2" />
      <path d="m287 316 23 95-40 13-27-98z" fill="#ddd5b9" opacity=".35" />
    </svg>
  );
}
