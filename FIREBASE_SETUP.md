# CHECK 부부 자동 동기화: Firebase 설정

이 문서는 **새 가족 공유 기능을 실제로 활성화하기 위한 필수 단계**입니다. 코드와 접근 규칙을 저장소에 포함해 두었지만, Firebase 프로젝트 생성·Google 로그인 동의·Firestore 보안 규칙 배포는 해당 Google 계정의 소유자가 승인해야 합니다.

## 1. Firebase 프로젝트 만들기

1. <https://console.firebase.google.com/> 에 Google 계정으로 로그인합니다.
2. **프로젝트 추가** → 예: CHECK Family → 프로젝트 생성.
3. **앱 추가**에서 웹 아이콘 (`</>`)을 선택하고 웹 앱 등록. 별도 Firebase Hosting 설정은 필요 없습니다.
4. 프로젝트 설정 → 일반 → 내 앱 → **SDK 설정 및 구성 → 구성**을 엽니다.
5. 나온 `firebaseConfig`의 **apiKey / authDomain / projectId / appId** 네 값을 `firebase-config.js`에 입력합니다. `measurementId`는 필요하지 않습니다.

```js
window.CHECK_FIREBASE_CONFIG = {
  apiKey: 'Firebase 콘솔에서 복사한 웹 API 키',
  authDomain: 'PROJECT_ID.firebaseapp.com',
  projectId: 'PROJECT_ID',
  appId: '1:123456789:web:example'
};
```

이 웹 설정값은 공개 클라이언트 식별자로 **서비스 계정의 비밀키가 아닙니다.** 대신 **Firestore 보안 규칙을 반드시 적용**해야 개인정보 접근이 차단됩니다. JSON 서비스 계정 키, OAuth client secret, private key, 비밀번호를 이 파일이나 GitHub에 절대 넣지 마세요.

## 2. 부부의 Google 로그인 활성화

Firebase Console → **빌드 → Authentication → 시작하기 → Sign-in method → Google → 사용 설정 → 저장**.

Authentication → Settings → **Authorized domains**에 아래 호스트를 추가합니다.

- `ugiomin31-ops.github.io` — GitHub Pages 앱의 공개 주소 호스트. `/check-family-benefits/` 경로를 붙이지 않습니다.
- `localhost` — 로컬 PC 테스트용(필요한 경우).

도메인 등록은 Google 로그인용 필수 설정입니다. 신규 Firebase 프로젝트에는 localhost가 기본 포함되지 않을 수 있습니다.

## 3. Cloud Firestore와 보안 규칙

1. Firebase Console → **빌드 → Firestore Database → 데이터베이스 만들기**.
2. 보안 규칙은 테스트 모드로 계속 사용하면 안 됩니다. **프로덕션 모드**로 만든 뒤 `firebase/firestore.rules` 파일의 전체 내용을 Firestore → **Rules** 탭에 붙여넣고 **게시**합니다.
3. Firestore 지역(예: Seoul `asia-northeast3`)은 프로젝트 설정 및 과금·지연시간을 고려해 선택합니다. 데이터베이스 위치는 나중에 바꾸기 어렵습니다.
4. 다음 권한을 실제로 차단하는 규칙입니다: 미로그인 조회, 타인 가족 문서, 가족 외부 쓰기, 초대 없는 참여, 3번째 계정 참여, 초대 재사용, 만료된 초대, 초대장 목록 조회.

보안 규칙은 **에뮬레이터에서 10개 테스트 통과**했습니다. 실제 Firebase 프로젝트에 규칙을 게시한 것은 아직 아닙니다.

## 4. GitHub 저장소에서 웹 설정 적용

**실제 공개 사이트에 적용되는 저장소는 [ugiomin31-ops/check-family-benefits](https://github.com/ugiomin31-ops/check-family-benefits)입니다.** 여기에서 `firebase-config.js`를 열고 **연필 아이콘(Edit)**으로 네 값을 입력한 후 커밋하세요. 또는 PC의 CHECK 폴더에 수정한 뒤 `npm run build:web`을 실행하고 공개 저장소에 정적 파일을 다시 업로드합니다. 비공개 `baby` 저장소만 수정하면 공개 사이트에 바로 반영되지 않습니다.

앱은 `firebase-config.js`의 설정이 유효하면 Google 로그인 기능을 표시합니다. 값이 비어 있으면 **기존 로컬 체크리스트만 사용**합니다.

## 5. 기존 기록을 보존하면서 가족 생성

가장 중요한 순서입니다.

1. 기존 PC CHECK(`http://localhost:4317/`) → **설정 → JSON 백업 내려받기**.
2. GitHub Pages 주소 `https://ugiomin31-ops.github.io/check-family-benefits/`를 컴퓨터에서 엽니다.
3. 아직 가족에 로그인하기 전에 **설정 → 백업 불러오기**로 1번의 JSON 파일을 가져옵니다.
4. **Google 로그인 → 현재 기록으로 가족 만들기**를 선택합니다. 이때 가족 정보·메모 등은 Firebase로 복사됩니다. 기존 `localhost` 기록은 삭제되지 않습니다.
5. 앱의 설정에서 **배우자 초대 링크 만들기 → 복사**, 메신저 등으로 배우자 한 명에게만 전달합니다.
6. 배우자는 **다른 Google 계정**으로 초대 링크를 열고 로그인한 뒤 **초대 링크로 가족 참여하기**를 누릅니다.
7. 부부가 각각 체크를 하나씩 수정하고 다른 기기에 반영되는지 직접 확인합니다. **자동 동기화 완료 표시**도 확인하세요.

초대 링크는 암호학적으로 무작위 생성한 43자리 코드이며 48시간 후 만료되도록 만들어져 있습니다. 1회 사용하고 가족은 최대 2명입니다. 만료되면 다시 만들어 주세요.

## 6. 백업·오프라인·충돌 처리

- 가족 기록은 Firebase Firestore에, 각 브라우저에는 별도 오프라인 캐시와 로컬 사본에 저장됩니다. 인터넷 복구 시 전송을 시도합니다.
- 항목별 문서로 분리해 체크 하나를 수정했다고 가족 전체 기록이 덮어써지지 않습니다. **같은 항목을 동시에 수정하면 마지막으로 서버에 반영된 기록**이 남을 수 있습니다.
- 기존 로컬 JSON을 나중에 가족 공간에 추가할 수도 있습니다. 로그인 상태의 **기존 기록에서 없는 항목 추가**는 서버에 없는 체크·개인 할 일만 가져옵니다. 배우자 기록과 가족 설정을 자동 덮어쓰지 않습니다.
- 브라우저 데이터·Firebase 웹 오프라인 캐시는 암호화된 비밀보관함이 아닙니다. **본인 개인 기기**에서만 로그인하세요.
- Firebase의 가족 구성원 접근을 해제해도 과거 상대방 기기에 다운로드된 오프라인 사본은 강제로 삭제할 수 없습니다.
- 서버의 실제 데이터와 동기화 상태는 최초 가족 생성·계정 연결 후에만 확인할 수 있습니다. 이 프로젝트는 미연결 상태에서 실제 사용자 데이터 전송을 시험하지 않았습니다.

## 7. 문제 해결

| 증상 | 확인할 부분 |
|---|---|
| Firebase 초기 설정 필요 | `firebase-config.js`에 네 항목 입력 후 GitHub 배포 갱신 |
| Google 팝업 실패 | Firebase Auth Google 공급자, authorized domain, 브라우저 팝업 차단 |
| permission-denied | Firestore Rules 게시 여부, 로그인한 Google 계정, 가족 멤버십 |
| 초대 참여 불가 | 48시간 만료, 한 번 사용, 2명 정원, 다른 계정으로 로그인 |
| 휴대폰과 PC에서 항목이 다름 | 같은 GitHub Pages 주소·같은 가족 공간 연결, 인터넷 재접속, 앱 업데이트 |
| localhost 기록이 안 보임 | localhost와 github.io는 저장소가 다른 주소. JSON 백업→가져오기 |

관련 공식 문서: [Firebase Google 로그인](https://firebase.google.com/docs/auth/web/google-signin), [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started), [Firestore 오프라인](https://firebase.google.com/docs/firestore/manage-data/enable-offline).
