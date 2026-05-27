let flag = 0; // 0: 멤버 등록(가입) 모드, 1: 일반 로그인 모드

$(".signin").on("click", function(){
  if(flag == 0){
    // ==========================================\
    // [등록 모드 -> 로그인 모드로 전환]
    // ==========================================\
    $(".move").addClass("moving").removeClass("start");
    $(".form").addClass("movingForm").removeClass("startForm");
    
    $(".hello").show();
    $(".welcome").hide();
    $(".move").css("background-position", "right");
    
    // 애니메이션 중간(200ms)에 실제 Form 속성과 텍스트 전환
    setTimeout(function(){
      $(".title").text("서비스 로그인");
      $(".light").text("등록된 구성원 이름 입력");
      $("#usernameInput").attr("placeholder", "등록된 이름 입력");
      
      // 🌟 중요: 폼 전송 대상을 로그인 엔드포인트로 확실하게 변경
      $("#authForm").attr("action", "/login"); 
      
      $(".p-button").text("신규 등록");
      $("#submitBtn").text("SIGN IN");
      
      $(".form").css("border-radius","10px 0px 0px 10px");
      $(".move").css("border-radius","0px 10px 10px 0px");
    }, 200);
    
    flag = 1;
  } else {
    // ==========================================\
    // [로그인 모드 -> 등록 모드로 복귀]
    // ==========================================\
    $(".move").removeClass("moving").addClass("start");
    $(".form").removeClass("movingForm").addClass("startForm");
    
    $(".hello").hide();
    $(".welcome").show();
    $(".move").css("background-position", "left");
    
    setTimeout(function(){
      $(".title").text("멤버 등록하기");
      $(".light").text("등록할 구성원 이름 입력");
      $("#usernameInput").attr("placeholder", "이름을 입력하세요");
      
      // 🌟 중요: 폼 전송 대상을 다시 회원가입 엔드포인트로 변경
      $("#authForm").attr("action", "/register"); 
      
      $(".p-button").text("SIGN IN");
      $("#submitBtn").text("SIGN UP");
      
      $(".form").css("border-radius","0px 10px 10px 0px");
      $(".move").css("border-radius","10px 0px 0px 10px");
    }, 200);
    
    flag = 0;
  }
});