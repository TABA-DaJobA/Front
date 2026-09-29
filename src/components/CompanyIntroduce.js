import React from 'react';
import Aiintro from '../assets/Ai소개.png';
import Dajobaintro from '../assets/Dajoba소개.png';
import result from '../assets/결과.png';

function CompanyIntroduce() {
  return (
    <div className="pb-24">
      <div className="flex justify-center items-center mt-52">
        <img src={Aiintro} style={{
          border: '1px solid gray'
        }} alt="" className="h-60 mr-24 ml-24 rounded-md" />
        <div className="flex flex-col justify-center">
          <div className="mb-10 text-xl font-bold">효율적인 AI 시스템!</div>
          <div className="mb-2">
            비지도 학습을 통한 직무분야 학습
          </div>
          <div className="mb-2">
            지도 학습을 통한 채용공고 매칭학습
          </div>
          <div>
            비지도 학습과 지도 학습을 이용한 매칭 알고리즘
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center mt-48 ">
        <div className="flex flex-col justify-center ml-48 mr-32">
          <div className="mb-2 text-xl font-bold">채용의 기회는</div>
          <div className="mb-10 text-xl font-bold">다잡아에서</div>
          <div className="mb-2">
            6만 건의 채용 공고 중에서
          </div>
          <div className="mb-2">
            자기소개서를 다잡아가 분석해
          </div>
          <div>
            내게 맞는 기업을 찾아드려요!
          </div>
        </div>
        <img src={Dajobaintro} style={{
          border: '1px solid gray'
        }} alt="" className="h-60 mr-24 ml-24 rounded-md" />
      </div>
      <div className="flex justify-center items-center mt-48">
        <img src={result} style={{
          border: '1px solid gray'
        }} alt="" className="h-60 mr-24 ml-24 rounded-md" />
        <div className="flex flex-col justify-center">
          <div className="mb-10 text-xl font-bold">분석결과</div>
          <div className="mb-2">
            자신의 학력 경력 등의 정보와
          </div>
          <div className="mb-2">
            자기소개서를 작성하면
          </div>
          <div className="mb-2">
            예상 합격률을 보여줍니다.
          </div>
          <div>
            지금 바로 시작해 봅시다.
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyIntroduce;