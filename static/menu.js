document.addEventListener('DOMContentLoaded', () => {
  // --- [초기 설정 및 데이터 세팅] ---
  const dinnerDateInput = document.getElementById('dinner-date');
  const opinionListBody = document.getElementById('opinion-list-body');
  const mealTimeRadios = document.querySelectorAll('input[name="meal-time"]');
  
  let isEditMode = false;
  let editTargetId = null;

  // 오늘 날짜 자동 할당
  const today = new Date().toISOString().split('T')[0];
  if (dinnerDateInput) dinnerDateInput.value = today;

  // --- [기능 1: 리스트 실시간 조회 및 출력] ---
  function renderOpinionList() {
    const selectedDate = dinnerDateInput.value;
    const timeRadioChecked = document.querySelector('input[name="meal-time"]:checked');
    if (!timeRadioChecked || !selectedDate) return;
    
    const selectedTime = timeRadioChecked.value;

    fetch(`/api/menus?date=${selectedDate}&time=${selectedTime}`)
      .then(response => {
        if (!response.ok) throw new Error('데이터 로드 실패');
        return response.json();
      })
      .then(data => {
        opinionListBody.innerHTML = ''; 

        if (!data || data.length === 0) {
          opinionListBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999; padding:20px;">등록된 의견이 없습니다. 첫 의견을 남겨보세요!</td></tr>`;
          return;
        }

        data.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><input type="radio" name="vote-target" value="${item.id}"></td>
            <td><strong>${item.username}</strong></td>
            <td><span class="badge">${item.meal_type}</span></td>
            <td>${item.picked_menu}</td>
            <td><small style="color:#7f8c8d">${item.notes || '-'}</small></td>
            <td><span style="color:#079992; font-weight:bold;">${item.votes}표</span></td>
          `;
          opinionListBody.appendChild(row);
        });
      })
      .catch(err => console.error(err));
  }

  // 감지기 등록
  if (dinnerDateInput) dinnerDateInput.addEventListener('change', renderOpinionList);
  mealTimeRadios.forEach(radio => radio.addEventListener('change', renderOpinionList));
  renderOpinionList(); // 최초 1회 실행

  // --- [기능 2: 의견 등록 및 수정 요청] ---
  const menuForm = document.getElementById('menu-form');
  menuForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const selectedDate = dinnerDateInput.value;
    const timeRadioChecked = document.querySelector('input[name="meal-time"]:checked');
    const mealType = document.getElementById('meal-type').value;
    const menuChoice = document.querySelector('input[name="menu-choice"]:checked').value;
    
    let pickedMenu = '';
    if (menuChoice === 'category') {
      pickedMenu = document.getElementById('menu-category').value;
    } else {
      pickedMenu = document.getElementById('direct-menu-name').value.trim();
      if (!pickedMenu) {
        alert('원하는 메뉴를 직접 입력해주세요!');
        return;
      }
    }

    const notes = document.getElementById('meal-notes').value;

    const payload = {
      date: selectedDate,
      time: timeRadioChecked.value,
      meal_type: mealType,
      picked_menu: pickedMenu,
      notes: notes
    };

    const url = isEditMode ? `/api/menus/${editTargetId}` : '/api/menus';
    const method = isEditMode ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error('의견 저장 실패');
      return res.json();
    })
    .then(data => {
      alert(data.message || '정상적으로 등록되었습니다!');
      // 폼 리셋 및 모드 원복
      isEditMode = false;
      editTargetId = null;
      document.getElementById('btn-submit-opinion').innerText = '✏️ 내 의견 등록하기';
      document.getElementById('direct-menu-name').value = '';
      document.getElementById('meal-notes').value = '';
      renderOpinionList();
    })
    .catch(err => alert(err.message));
  });

  // --- [기능 3: 선택된 메뉴 투표하기] ---
  const btnSubmitVote = document.getElementById('btn-submit-vote');
  if (btnSubmitVote) {
    btnSubmitVote.addEventListener('click', () => {
      const checkedRadio = document.querySelector('input[name="vote-target"]:checked');
      if (!checkedRadio) {
        alert('투표할 메뉴 후보를 선택해주세요!');
        return;
      }
      const menuId = checkedRadio.value;

      fetch(`/api/menus/${menuId}/vote`, { method: 'POST' })
        .then(res => {
          if (!res.ok) throw new Error('투표 반영 실패');
          return res.json();
        })
        .then(data => {
          alert('🗳️ 투eper 투표가 성공적으로 반영되었습니다!');
          renderOpinionList();
        })
        .catch(err => alert(err.message));
    });
  }

  // --- [기능 4: 의견 수정 활성화] ---
  const btnEditMenu = document.getElementById('btn-edit-menu');
  if (btnEditMenu) {
    btnEditMenu.addEventListener('click', () => {
      const checkedRadio = document.querySelector('input[name="vote-target"]:checked');
      if (!checkedRadio) {
        alert('수정할 본인 의견을 선택해 주세요.');
        return;
      }
      
      editTargetId = checkedRadio.value;
      isEditMode = true;
      document.getElementById('btn-submit-opinion').innerText = '💾 내 의견 수정 완료하기';
      
      // 스크롤 이동
      document.querySelector('.menu-section').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // --- [기능 5: 의견 삭제] ---
  const btnDeleteMenu = document.getElementById('btn-delete-menu');
  if (btnDeleteMenu) {
    btnDeleteMenu.addEventListener('click', () => {
      const checkedRadio = document.querySelector('input[name="vote-target"]:checked');
      if (!checkedRadio) {
        alert('삭제할 의견을 선택해 주세요.');
        return;
      }

      if (!confirm('정말로 이 의견을 삭제하시겠습니까?')) return;
      const menuId = checkedRadio.value;

      fetch(`/api/menus/${menuId}`, { method: 'DELETE' })
        .then(res => {
          if (!res.ok) throw new Error('삭제 권한이 없거나 실패했습니다.');
          return res.json();
        })
        .then(data => {
          alert('🗑️ 의견이 정상적으로 삭제되었습니다.');
          renderOpinionList();
        })
        .catch(err => alert(err.message));
    });
  }

  // --- [기능 6: 실시간 결과 확인 그래프 모달] ---
  const btnShowResults = document.getElementById('btn-show-results');
  if (btnShowResults) {
    btnShowResults.addEventListener('click', () => {
      const selectedDate = dinnerDateInput.value;
      const timeRadioChecked = document.querySelector('input[name="meal-time"]:checked').value;
      // 결과를 보여줄 새 팝업 혹은 대안 모달 구현 라인
      alert(`📈 [${selectedDate} / ${timeRadioChecked}] 차트 분석 기능을 호출합니다.`);
    });
  }

  // --- [기능 7: 돌림판 위젯 토글 및 스핀 연동] ---
  const btnTriggerRoulette = document.getElementById('btn-trigger-roulette');
  const rouletteContainer = document.getElementById('roulette-container');
  const btnSpin = document.getElementById('btn-spin');
  const rouletteWheel = document.querySelector('.roulette-wheel');

  if (btnTriggerRoulette && rouletteContainer) {
    btnTriggerRoulette.addEventListener('click', () => {
      rouletteContainer.style.display = (rouletteContainer.style.display === 'none') ? 'block' : 'none';
    });
  }

  let isSpinning = false;
  let currentDegree = 0;

  if (btnSpin && rouletteWheel) {
    btnSpin.addEventListener('click', () => {
      if (isSpinning) return;
      isSpinning = true;

      const menus = ['한식 뷔페', '분식집', '트레이더스', '편의점'];
      const randomIndex = Math.floor(Math.random() * menus.length);
      const pickedMenu = menus[randomIndex];

      let targetDegree = 0;
      if (randomIndex === 0) targetDegree = 315; 
      if (randomIndex === 1) targetDegree = 45;  
      if (randomIndex === 2) targetDegree = 225; 
      if (randomIndex === 3) targetDegree = 135; 

      currentDegree += 1800 + targetDegree - (currentDegree % 360);
      rouletteWheel.style.transform = `rotate(${currentDegree}deg)`;

      setTimeout(() => {
        isSpinning = false;
        alert(`🔮 돌림판이 추천하는 오늘의 메뉴는 바로 [ ${pickedMenu} ] 입니다!`);
      }, 3000);
    });
  }

  // --- [기능 8: 히스토리 기록 모달 토글] ---
  const btnHistory = document.getElementById('btn-history');
  const historyModal = document.getElementById('history-modal');
  const closeHistory = document.getElementById('close-history');

  if (btnHistory && historyModal && closeHistory) {
    btnHistory.addEventListener('click', () => { historyModal.style.display = 'flex'; });
    closeHistory.addEventListener('click', () => { historyModal.style.display = 'none'; });
  }
});