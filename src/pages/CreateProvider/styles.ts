import styled from 'styled-components';

export const Container = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 600px;
  background: #28262e;
  padding: 48px;
  border-radius: 10px;

  h1 {
    margin-bottom: 24px;
    color: #f4ede8;
    font-size: 24px;
  }

  form {
    width: 100%;
    display: flex;
    flex-direction: column;
  }
`;

export const ScheduleContainer = styled.div`
  margin-top: 24px;
  margin-bottom: 16px;

  h2 {
    color: #999591;
    font-size: 18px;
    margin-bottom: 16px;
    border-bottom: 1px solid #3e3b47;
    padding-bottom: 8px;
  }
`;

export const ScheduleItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  background: #232129;
  padding: 12px;
  border-radius: 8px;

  .day-info {
    display: flex;
    align-items: center;
    
    input[type="checkbox"] {
      margin-right: 12px;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    span {
      color: #f4ede8;
      width: 100px;
      font-size: 16px;
    }
  }

  .time-inputs {
    display: flex;
    align-items: center;

    span {
      color: #999591;
      margin: 0 8px;
    }

    input[type="time"] {
      background: #28262e;
      border: 1px solid #232129;
      color: #f4ede8;
      padding: 8px;
      border-radius: 8px;
      color-scheme: dark;
    }
  }
`;