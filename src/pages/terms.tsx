import React from 'react'
import Head from 'next/head'

const TermsOfService: React.FC = () => {
  return (
    <>
      <Head>
        <title>이용약관 - GQ AI</title>
        <meta name="description" content="GQ AI 서비스 이용약관" />
      </Head>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>서비스 이용약관</h1>

        <p style={{ color: '#666', marginBottom: 40 }}>
          최종 수정일: {new Date().toLocaleDateString('ko-KR')}
        </p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>제1조 (목적)</h2>
          <p>
            본 약관은 GQ AI(이하 "회사")가 제공하는 뉴스 정보 서비스 및 관련 제반 서비스(이하 "서비스")의 이용과 관련하여
            회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>제2조 (정의)</h2>
          <p>
            본 약관에서 사용하는 용어의 정의는 다음과 같습니다:
          </p>
          <ol>
            <li><strong>"서비스"</strong>란 회사가 제공하는 뉴스 정보 플랫폼 및 관련 제반 서비스를 의미합니다.</li>
            <li><strong>"이용자"</strong>란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
            <li><strong>"콘텐츠"</strong>란 회사가 서비스에 게시한 부호, 문자, 음성, 음향, 영상 등의 정보를 의미합니다.</li>
          </ol>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>제3조 (약관의 명시와 개정)</h2>
          <p>
            1. 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.
          </p>
          <p>
            2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
          </p>
          <p>
            3. 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에
            그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>제4조 (서비스의 제공 및 변경)</h2>
          <p>
            1. 회사는 다음과 같은 서비스를 제공합니다:
          </p>
          <ul>
            <li>뉴스 정보 제공 서비스</li>
            <li>뉴스 분석 및 인사이트 제공</li>
            <li>법안 모니터링 서비스</li>
            <li>정치 리포트 서비스</li>
            <li>기타 회사가 정하는 서비스</li>
          </ul>
          <p>
            2. 회사는 상당한 이유가 있는 경우에 운영상, 기술상의 필요에 따라 제공하고 있는 전부 또는 일부 서비스를 변경할 수 있습니다.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>제5조 (서비스 이용시간)</h2>
          <p>
            1. 서비스의 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴 1일 24시간을 원칙으로 합니다.
            다만, 정기점검 등의 필요로 회사가 정한 날이나 시간은 제외됩니다.
          </p>
          <p>
            2. 회사는 서비스를 일정범위로 분할하여 각 범위별로 이용가능시간을 별도로 정할 수 있습니다.
            이 경우 그 내용을 사전에 공지합니다.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>제6조 (이용자의 의무)</h2>
          <p>
            1. 이용자는 다음 행위를 하여서는 안 됩니다:
          </p>
          <ul>
            <li>서비스 이용 신청 또는 변경 시 허위내용 등록</li>
            <li>타인의 정보도용</li>
            <li>회사가 게시한 정보의 변경</li>
            <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
            <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
            <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
            <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>제7조 (저작권의 귀속 및 이용제한)</h2>
          <p>
            1. 회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.
          </p>
          <p>
            2. 이용자는 서비스를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이
            복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>제8조 (광고게재)</h2>
          <p>
            1. 회사는 서비스 운영과 관련하여 서비스 화면, 홈페이지 등에 광고를 게재할 수 있습니다.
          </p>
          <p>
            2. 회사는 Google AdSense 등 제3자 광고 서비스를 통해 광고를 게재할 수 있으며,
            이용자가 광고를 클릭하거나 이용하는 경우 발생하는 결과에 대해 회사는 책임을 지지 않습니다.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>제9조 (면책조항)</h2>
          <p>
            1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
          </p>
          <p>
            2. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.
          </p>
          <p>
            3. 회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며,
            그 밖에 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.
          </p>
          <p>
            4. 회사는 제공하는 뉴스 정보의 정확성, 신뢰성, 적시성에 대해 보증하지 않습니다.
            모든 뉴스 정보는 참고용으로만 제공되며, 이용자는 독자적인 판단과 책임 하에 정보를 활용해야 합니다.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>제10조 (재판권 및 준거법)</h2>
          <p>
            1. 회사와 이용자 간에 발생한 서비스 이용에 관한 분쟁에 대하여는 대한민국 법을 적용합니다.
          </p>
          <p>
            2. 회사와 이용자 간에 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제소합니다.
          </p>
        </section>

        <div style={{
          marginTop: 60,
          padding: 20,
          background: '#f5f5f5',
          borderRadius: 8,
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>
            부칙
          </p>
          <p style={{ margin: '10px 0 0', color: '#666' }}>
            본 약관은 {new Date().toLocaleDateString('ko-KR')}부터 적용됩니다.
          </p>
        </div>
      </div>
    </>
  )
}

export default TermsOfService
