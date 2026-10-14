# CHECK · 우리 가족의 시작

한국 임신·출산·육아 신청을 준비하는 PWA입니다. 체크리스트 UI는 공개 정적 파일로 실행되며, 가족 기록은 로그인한 두 계정만 접근할 수 있도록 별도 Firebase Firestore에 저장하도록 설계했습니다.

- 웹 앱: https://ugiomin31-ops.github.io/check-family-benefits/ (기존 GitHub Pages 공개 사이트)
- [GitHub Pages 설정](GITHUB_PAGES_SETUP.md)
- [Firebase Google 로그인·부부 공유 설정](FIREBASE_SETUP.md)
- [Firestore 접근 규칙](firebase/firestore.rules)

**중요:** Firebase 웹 설정은 firebase-config.js에 본인이 등록해야 Google 로그인 버튼이 작동합니다. 규칙을 Firebase 콘솔에 게시하지 않은 상태로 가족 정보를 넣지 마세요. Firebase 연결 전에는 기존 브라우저 전용 체크리스트로 작동합니다.

기존 localhost 기록은 접속 주소가 달라 자동 이동되지 않습니다. 먼저 JSON 백업→새 주소에서 복원→새 가족 생성 순서로 진행하세요. 소득·거주·신청기한 등 최신 공식 제도는 신청 당시 기관에서 확인해야 합니다.

이 저장소에는 사용자별 체크 상태·의료 서류·Google 계정 비밀정보가 포함되어서는 안 됩니다.
