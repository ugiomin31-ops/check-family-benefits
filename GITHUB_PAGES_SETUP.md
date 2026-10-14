# CHECK GitHub 저장소와 공개 휴대폰 앱

소스 저장소: <https://github.com/ugiomin31-ops/baby> — **비공개로 유지**.

공개 GitHub Pages 저장소: <https://github.com/ugiomin31-ops/check-family-benefits> — **공개 static site**.

실제 사용자 웹사이트: **https://ugiomin31-ops.github.io/check-family-benefits/**

## 두 저장소로 나눈 이유

사용자의 GitHub 계정은 GitHub Free이며 `baby`는 비공개 저장소입니다. 이 플랜에서는 private 저장소의 GitHub Pages 사용이 제한됩니다. 이전에 운영 중이었던 공개 `check-family-benefits` 저장소의 Pages를 계속 이용하면 `baby`를 공개로 바꿀 필요가 없습니다.

**중요:** 공개 사이트에는 정적 웹 코드·공식 혜택 데이터·Firebase 웹 프로젝트 식별자만 들어갑니다. 개인 체크·메모·Google 계정 비밀번호·서비스 계정 키는 커밋하지 않습니다. 가족 정보와 체크는 적절한 Firestore 보안 규칙 게시 후 로그인 계정의 가족 공간에 별도로 저장됩니다.

## GitHub Pages 설정 확인

공개 저장소 Settings → Pages에서 main 브랜치의 /(root) 폴더를 배포합니다. GitHub Pages가 정상 배포한 이후 위 HTTPS 주소를 사용합니다.

비공개 `baby` 저장소에는 동일한 최신 공개 정적 파일, 보안 규칙, 설정·설치 안내 문서를 보관합니다. 공개 홈페이지 코드 갱신 시에는 **공개 저장소도 별도로 업데이트**해야 휴대폰 사용자에게 새 화면이 전달됩니다.

## Firebase Google 로그인 설정

공개 홈페이지에서 아직 Firebase 로그인 설정이 연결되지 않았다면 [FIREBASE_SETUP.md](FIREBASE_SETUP.md) 지침을 따르세요. Firebase 프로젝트의 Google 공급자를 활성화하고 승인 도메인 `ugiomin31-ops.github.io`를 등록해야 합니다. 공개 저장소 `firebase-config.js`에 웹 설정 네 항목을 입력하고, Firebase Firestore 콘솔에는 `firebase/firestore.rules`를 게시하세요.

## Android·iPhone에서 설치

갤럭시 Android Chrome: HTTPS 주소 열기 → 메뉴 → **앱 설치** 또는 **홈 화면에 추가**.

iPhone Safari: HTTPS 주소 열기 → 공유 → **홈 화면에 추가**.

컴퓨터는 꺼도 됩니다. GitHub Pages는 웹사이트를, Firebase는 등록 후 가족 체크 기록을 제공합니다. 로그인 초기 설정이나 외부 정부 신청 사이트 이용은 인터넷이 필요합니다. 처음 온라인으로 실행해 PWA 캐시가 준비되면 앱 일부 화면은 인터넷 없이 사용할 수 있습니다.

## 기존 CHECK 기록 이전

localhost와 GitHub Pages는 서로 다른 브라우저 저장 공간입니다. 기존 PC CHECK에서 JSON 백업 → **공개 GitHub Pages의 CHECK**로 접속 → 로그인 전에 JSON 불러오기 → Google 로그인 및 가족 생성 순서로 진행하면 기존 기록을 보존할 수 있습니다. 가족 공유를 이미 만들었다면 앱의 **기존 기록에서 없는 항목 추가**로 누락된 항목만 합칩니다.
