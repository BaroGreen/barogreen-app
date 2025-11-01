// app/helpers/emailValidator.js
export function emailValidator(email){
  const re=/\S+@\S+\.\S+/;
  if(!email) return '이메일을 입력해 주세요.';
  if(!re.test(email)) return '올바른 이메일 주소를 입력해 주세요!';
  return '';
}
