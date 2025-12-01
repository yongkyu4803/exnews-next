import React from 'react'
import Head from 'next/head'

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <Head>
        <title>개인정보 처리방침 - GQ AI</title>
        <meta name="description" content="GQ AI 개인정보 처리방침" />
      </Head>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>개인정보 처리방침</h1>

        <p style={{ color: '#666', marginBottom: 40 }}>
          최종 수정일: {new Date().toLocaleDateString('ko-KR')}
        </p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>1. 개인정보의 수집 및 이용 목적</h2>
          <p>
            GQ AI(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다.
            처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
            이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          </p>
          <ul>
            <li>서비스 제공 및 운영</li>
            <li>회원 관리 및 본인 확인</li>
            <li>서비스 개선 및 맞춤형 서비스 제공</li>
            <li>통계 분석 및 서비스 품질 개선</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>2. 수집하는 개인정보 항목</h2>
          <p>
            회사는 서비스 제공을 위해 다음과 같은 정보를 수집합니다:
          </p>
          <ul>
            <li><strong>자동 수집 정보</strong>: IP 주소, 쿠키, 서비스 이용 기록, 방문 기록, 불량 이용 기록</li>
            <li><strong>디바이스 정보</strong>: 기기 정보, OS 버전, 브라우저 정보</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>3. 개인정보의 보유 및 이용기간</h2>
          <p>
            회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
          </p>
          <ul>
            <li>서비스 이용 기록: 3개월</li>
            <li>접속 로그 기록: 3개월</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>4. 쿠키(Cookie)의 운용</h2>
          <p>
            회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.
          </p>
          <p>
            쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며
            이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.
          </p>
          <ul>
            <li><strong>쿠키의 사용 목적</strong>: 이용자의 접속 빈도나 방문 시간 등을 분석하여 서비스 개선 및 맞춤 서비스 제공</li>
            <li><strong>쿠키의 설치·운영 및 거부</strong>: 웹브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>5. 제3자 광고 서비스</h2>
          <p>
            본 서비스는 Google AdSense를 통해 광고를 게재합니다. Google은 본 사이트 방문자에게 맞춤형 광고를 제공하기 위해 쿠키를 사용합니다.
          </p>
          <p>
            Google의 광고 쿠키 사용을 거부하려면{' '}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
              Google 광고 설정
            </a>
            에서 설정할 수 있습니다.
          </p>
          <p>
            Google의 개인정보 보호정책은{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              여기
            </a>
            에서 확인하실 수 있습니다.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>6. 개인정보의 파기</h2>
          <p>
            회사는 원칙적으로 개인정보 처리목적이 달성된 경우에는 지체없이 해당 개인정보를 파기합니다.
            파기의 절차, 기한 및 방법은 다음과 같습니다.
          </p>
          <ul>
            <li><strong>파기절차</strong>: 이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.</li>
            <li><strong>파기방법</strong>: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>7. 정보주체의 권리·의무 및 행사방법</h2>
          <p>
            이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:
          </p>
          <ul>
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구</li>
            <li>처리정지 요구</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>8. 개인정보 보호책임자</h2>
          <p>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여
            아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <ul>
            <li><strong>이메일</strong>: privacy@gqai.kr</li>
            <li><strong>웹사이트</strong>: https://gqai.kr</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>9. 개인정보 처리방침 변경</h2>
          <p>
            이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는
            변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </p>
        </section>

        <div style={{
          marginTop: 60,
          padding: 20,
          background: '#f5f5f5',
          borderRadius: 8,
        }}>
          <p style={{ margin: 0, color: '#666' }}>
            본 개인정보 처리방침은 {new Date().toLocaleDateString('ko-KR')}부터 적용됩니다.
          </p>
        </div>
      </div>
    </>
  )
}

export default PrivacyPolicy
