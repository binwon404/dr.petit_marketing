// 화면 언어 (한국어 · 일본어 · 중국어 · 영어)
// 코드에는 한국어 문구를 그대로 쓰고 T('한국어 문구')로 감싸면, 고른 언어의 문구로 바뀜
// 사전에 없는 문구는 한국어 그대로 나옴 → 문구를 새로 넣으면 아래 DICT에도 [일본어, 중국어, 영어]를 추가할 것
(() => {
  const KEY = 'mkboard-lang';
  const LANGS = { ko: '한국어', ja: '日本語', zh: '中文', en: 'English' };
  const IDX = { ja: 0, zh: 1, en: 2 };
  const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let lang = 'ko';
  try {
    const saved = localStorage.getItem(KEY);
    const nav = (navigator.language || '').toLowerCase();
    lang = LANGS[saved] ? saved : nav.startsWith('ja') ? 'ja' : nav.startsWith('zh') ? 'zh' : nav.startsWith('en') ? 'en' : 'ko';
  } catch (e) { /* 저장소를 못 쓰면 한국어 */ }

  const DICT = {
    // ---- 공통 · 상단 ----
    '마케팅 관리보드': ['マーケティング管理ボード', '营销管理看板', 'Marketing Board'],
    '마케팅 관리보드 - 로그인': ['マーケティング管理ボード - ログイン', '营销管理看板 - 登录', 'Marketing Board - Sign in'],
    '홈': ['ホーム', '首页', 'Home'],
    '광고 목록': ['広告一覧', '广告列表', 'Ad list'],
    '수정 이력': ['変更履歴', '修改记录', 'Change log'],
    '설정': ['設定', '设置', 'Settings'],
    '가이드': ['ガイド', '指南', 'Guide'],
    '로그아웃': ['ログアウト', '退出登录', 'Sign out'],
    '메뉴': ['メニュー', '菜单', 'Menu'],
    '불러오는 중이에요': ['読み込み中です', '加载中', 'Loading'],
    '다시 불러오기': ['読み込み直す', '重新加载', 'Reload'],
    '불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.': ['読み込めませんでした。インターネット接続を確認して、もう一度お試しください。', '加载失败。请检查网络后再试。', 'Could not load. Check your internet connection and try again.'],
    '보기 전용': ['閲覧のみ', '仅查看', 'View only'],
    '전체 관리': ['全体管理', '全部管理', 'Full access'],
    '팀 계정': ['チームアカウント', '小组账号', 'Team account'],
    '관리자': ['管理者', '管理员', 'Admin'],
    '닫기': ['閉じる', '关闭', 'Close'],
    '취소': ['キャンセル', '取消', 'Cancel'],
    '저장': ['保存', '保存', 'Save'],
    '등록': ['登録', '登记', 'Add'],
    '삭제': ['削除', '删除', 'Delete'],
    '변경': ['変更', '修改', 'Change'],
    '없음': ['なし', '无', 'None'],
    '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.': ['保存できませんでした。しばらくしてからもう一度お試しください。', '保存失败。请稍后再试。', 'Could not save. Please try again shortly.'],
    '이 계정으로는 할 수 없는 작업이에요.': ['このアカウントではできない操作です。', '此账号无法进行该操作。', 'This account is not allowed to do that.'],
    '바뀐 내용이 없어요': ['変更はありません', '没有修改内容', 'Nothing changed'],

    // ---- 로그인 ----
    '어느 계정으로 들어갈까요?': ['どのアカウントで入りますか？', '用哪个账号进入？', 'Which account?'],
    '계정 목록을 불러오는 중이에요': ['アカウント一覧を読み込み中です', '正在加载账号列表', 'Loading accounts'],
    '계정 목록을 불러오지 못했어요. 새로고침해 주세요.': ['アカウント一覧を読み込めませんでした。ページを更新してください。', '无法加载账号列表。请刷新页面。', 'Could not load the accounts. Please refresh the page.'],
    '비밀번호': ['パスワード', '密码', 'Password'],
    '숫자 4자리': ['数字4桁', '4位数字', '4 digits'],
    '들어가기': ['入る', '进入', 'Sign in'],
    '비밀번호를 10번 틀리면 10분 동안 잠겨요. 비밀번호는 관리자에게 물어봐 주세요.': ['パスワードを10回まちがえると10分間ロックされます。パスワードは管理者に聞いてください。', '密码输错10次会锁定10分钟。密码请向管理员询问。', 'After 10 wrong tries the account is locked for 10 minutes. Ask the admin for the password.'],
    '비밀번호 숫자 4자리를 입력해 주세요.': ['パスワードの数字4桁を入力してください。', '请输入4位数字密码。', 'Please enter the 4-digit password.'],
    '접속하지 못했어요. 잠시 뒤 다시 시도해 주세요.': ['ログインできませんでした。しばらくしてからもう一度お試しください。', '登录失败。请稍后再试。', 'Could not sign in. Please try again shortly.'],
    '비밀번호를 10번 틀려 잠겼어요. {n}분 뒤에 다시 시도해 주세요.': ['パスワードを10回まちがえたのでロックされました。{n}分後にもう一度お試しください。', '密码输错10次，已被锁定。请{n}分钟后再试。', 'Locked after 10 wrong tries. Please try again in {n} minutes.'],
    '비밀번호가 맞지 않아요.': ['パスワードが違います。', '密码不正确。', 'Wrong password.'],
    ' {n}번 더 틀리면 10분 동안 잠겨요.': [' あと{n}回まちがえると10分間ロックされます。', ' 再输错{n}次将锁定10分钟。', ' {n} more wrong tries will lock it for 10 minutes.'],
    ' 다시 확인해 주세요.': [' もう一度確認してください。', ' 请再确认一下。', ' Please check it again.'],

    // ---- 판정 · 상태 · 목적 · 통화 ----
    '최상 - 지속유지': ['最良 - 継続', '最佳 - 继续投放', 'Best - Keep'],
    '양호 - 관망필요': ['良好 - 様子見', '良好 - 继续观察', 'Good - Watch'],
    '미흡 - 교체필요': ['不十分 - 交換が必要', '不佳 - 需要更换', 'Poor - Replace'],
    '판단 보류': ['判定保留', '暂不判定', 'Not rated yet'],
    '최상': ['最良', '最佳', 'Best'],
    '양호': ['良好', '良好', 'Good'],
    '미흡': ['不十分', '不佳', 'Poor'],
    '보류': ['保留', '暂缓', 'On hold'],
    '진행중': ['配信中', '投放中', 'Running'],
    '일시정지': ['一時停止', '暂停', 'Paused'],
    '종료': ['終了', '结束', 'Ended'],
    '판매': ['販売', '销售', 'Sales'],
    '유입': ['集客', '引流', 'Traffic'],
    '원 (KRW)': ['ウォン (KRW)', '韩元 (KRW)', 'Korean won (KRW)'],
    '달러 (USD)': ['ドル (USD)', '美元 (USD)', 'US dollar (USD)'],
    '엔 (JPY)': ['円 (JPY)', '日元 (JPY)', 'Japanese yen (JPY)'],
    '위안 (CNY)': ['人民元 (CNY)', '人民币 (CNY)', 'Chinese yuan (CNY)'],
    '미지정': ['未指定', '未指定', 'Not set'],
    '카드를 지정해 주세요': ['カードを指定してください', '请指定卡', 'Please set a card'],

    // ---- 날짜 ----
    '{y}년 {m}월': ['{y}年{m}月', '{y}年{m}月', '{mn} {y}'],
    '{m}월': ['{m}月', '{m}月', '{mn}'],
    '{m}월 누적': ['{m}月の累計', '{m}月累计', '{mn} total'],
    '이번 달': ['今月', '本月', 'this month'],
    '볼 달': ['表示する月', '查看月份', 'Month to view'],

    // ---- 판정 설명 ----
    '{month} 입력된 성과가 없어요': ['{month}は入力された成果がありません', '{month}还没有填写成果', 'No results entered for {month}'],
    '클릭 {a}회 · {b}회 이상 쌓이면 판정해요': ['クリック{a}回 · {b}回以上たまると判定します', '点击{a}次 · 累计{b}次以上后判定', '{a} clicks · Rated once there are {b} or more'],
    'ROAS {r}배': ['ROAS {r}倍', 'ROAS {r}倍', 'ROAS {r}x'],
    '{x}배': ['{x}倍', '{x}倍', '{x}x'],
    '1만 원 써서 {r}만 원 매출 · 기준: 최상 {a}배 이상, 양호 {b}배 이상': ['1万使って{r}万の売上 · 基準: 最良 {a}倍以上、良好 {b}倍以上', '花1万带来{r}万销售额 · 标准: 最佳 {a}倍以上，良好 {b}倍以上', 'Spend 1, earn {r} in revenue · Standard: Best {a}x or more, Good {b}x or more'],
    '클릭 1번에 약 {c}{krw} · 기준: 최상 {a} 이하, 양호 {b} 이하': ['クリック1回あたり約{c}{krw} · 基準: 最良 {a}以下、良好 {b}以下', '每次点击约{c}{krw} · 标准: 最佳 {a}以下，良好 {b}以下', 'About {c} per click{krw} · Standard: Best {a} or less, Good {b} or less'],
    ' (원화 환산)': [' (ウォン換算)', ' (折合韩元)', ' (in KRW)'],

    // ---- 홈 ----
    '+ 광고 등록': ['+ 広告登録', '+ 登记广告', '+ Add ad'],
    '전체 팀': ['全チーム', '全部小组', 'All teams'],
    '{month} 광고 현황': ['{month}の広告状況', '{month}广告概况', 'Ad status: {month}'],
    '월 예산 사용': ['月予算の使用', '月预算使用', 'Monthly budget used'],
    '남은 예산 {x}': ['残り予算 {x}', '剩余预算 {x}', 'Remaining budget {x}'],
    ' · 해외 광고비는 원화로 환산했어요': [' · 海外の広告費はウォンに換算しています', ' · 海外广告费已折合成韩元', ' · Overseas spend is converted to KRW'],
    '판정별 광고 수': ['判定ごとの広告数', '各判定的广告数', 'Number of ads by rating'],
    '교체가 필요한 광고': ['交換が必要な広告', '需要更换的广告', 'Ads to replace'],
    '{n}건': ['{n}件', '{n}个', '{n}'],
    '교체가 필요한 광고가 없어요': ['交換が必要な広告はありません', '没有需要更换的广告', 'No ads need replacing'],
    '팀별 결제 카드': ['チーム別の支払いカード', '各组付款卡', 'Payment cards by team'],
    '종료된 광고는 빼고 보여줘요': ['終了した広告は除いています', '不包含已结束的广告', 'Ended ads are not included'],
    '카드 지정 필요': ['カードの指定が必要', '需要指定卡', 'Card needed'],
    '광고 {n}개': ['広告{n}件', '{n}个广告', 'Ads: {n}'],
    '연결된 카드 없음': ['カードなし', '没有关联的卡', 'No card linked'],
    '팀별 현황': ['チーム別の状況', '各组概况', 'Status by team'],
    '지난주({w}) 성과 입력': ['先週({w})の成果入力', '填写上周({w})成果', 'Enter last week ({w}) results'],
    '{n}건 남음': ['残り{n}件', '还剩{n}个', '{n} left'],
    '완료': ['完了', '完成', 'Done'],
    '입력하기': ['入力する', '去填写', 'Enter'],
    '진행 중인 광고의 성과를 모두 입력했어요': ['配信中の広告の成果をすべて入力しました', '投放中广告的成果已全部填写', 'All results for running ads are entered'],

    // ---- 광고 목록 ----
    '진행 중인 광고가 없어요. "종료 광고 보기"를 켜면 끝난 광고가 나와요': ['配信中の広告はありません。「終了した広告を表示」をオンにすると終わった広告が出ます', '没有投放中的广告。打开"显示已结束的广告"可以看到结束的广告', 'No running ads. Turn on "Show ended ads" to see finished ads'],
    '조건에 맞는 광고가 없어요': ['条件に合う広告はありません', '没有符合条件的广告', 'No ads match the filters'],
    '아직 등록된 광고가 없어요': ['まだ登録された広告はありません', '还没有登记的广告', 'No ads yet'],
    '{month} 누적 기준 · 문제 있는 광고가 위에 와요': ['{month}の累計 · 問題のある広告が上に来ます', '按{month}累计 · 有问题的广告排在上面', '{month} totals · Ads with problems come first'],
    '모든 팀': ['すべてのチーム', '所有小组', 'All teams'],
    '모든 매체': ['すべての媒体', '所有媒体', 'All platforms'],
    '모든 판정': ['すべての判定', '所有判定', 'All ratings'],
    '필터 지우기': ['フィルターを消す', '清除筛选', 'Clear filters'],
    '종료 광고 보기 ({n})': ['終了した広告を表示 ({n})', '显示已结束的广告 ({n})', 'Show ended ads ({n})'],
    '판정': ['判定', '判定', 'Rating'],
    '광고': ['広告', '广告', 'Ad'],
    '상태': ['状態', '状态', 'Status'],
    '{month} 예산 사용': ['{month}の予算使用', '{month}预算使用', 'Budget used: {month}'],
    '결제 카드': ['支払いカード', '付款卡', 'Payment card'],
    '핵심 지표': ['主な指標', '核心指标', 'Key metric'],
    '일 예산 {x}': ['1日の予算 {x}', '每日预算 {x}', 'Daily budget {x}'],

    // ---- 광고 상세 ----
    '{o} 광고': ['{o}広告', '{o}广告', '{o} ad'],
    '기간': ['期間', '期间', 'Period'],
    '종료일 없음': ['終了日なし', '无结束日期', 'no end date'],
    '일 예산': ['1日の予算', '每日预算', 'Daily budget'],
    '월 예산': ['1か月の予算', '每月预算', 'Monthly budget'],
    '(약 {x})': ['(約 {x})', '(约 {x})', '(about {x})'],
    '소재 이미지': ['広告の画像', '广告图片', 'Ad image'],
    '등록된 소재 이미지가 없어요': ['登録された画像はありません', '还没有上传图片', 'No image uploaded'],
    '이미지 추가': ['画像を追加', '添加图片', 'Add image'],
    '주간 성과': ['週ごとの成果', '每周成果', 'Weekly results'],
    '광고비': ['広告費', '广告费', 'Spend'],
    '노출': ['表示', '展示', 'Impr.'],
    '클릭': ['クリック', '点击', 'Clicks'],
    '전환': ['成果', '转化', 'Conv.'],
    '매출': ['売上', '销售额', 'Revenue'],
    '입력': ['入力者', '填写人', 'By'],
    '아직 입력된 성과가 없어요': ['まだ入力された成果はありません', '还没有填写成果', 'No results entered yet'],
    '광고 정보 수정': ['広告情報の修正', '修改广告信息', 'Edit ad'],
    '성과 입력': ['成果入力', '填写成果', 'Enter results'],

    // ---- 광고 등록 · 수정 ----
    '새 광고 등록': ['新しい広告の登録', '登记新广告', 'Add a new ad'],
    '팀': ['チーム', '小组', 'Team'],
    '매체': ['媒体', '媒体', 'Platform'],
    '광고 이름': ['広告名', '广告名称', 'Ad name'],
    '예: 가을 신제품 수분크림 전환': ['例: 秋の新商品 保湿クリーム', '例: 秋季新品保湿霜', 'e.g. Autumn moisturizer sales'],
    '광고 목적': ['広告の目的', '广告目的', 'Ad goal'],
    '매출이 목표예요. ROAS로 판정해요': ['売上が目標です。ROASで判定します', '目标是销售额。按ROAS判定', 'The goal is revenue. Rated by ROAS'],
    '방문·상담이 목표예요. CPC로 판정해요': ['来店・相談が目標です。CPCで判定します', '目标是到店、咨询。按CPC判定', 'The goal is visits or inquiries. Rated by CPC'],
    '시작일': ['開始日', '开始日期', 'Start date'],
    '종료일 (선택)': ['終了日 (任意)', '结束日期 (可选)', 'End date (optional)'],
    '통화': ['通貨', '货币', 'Currency'],
    '카드를 선택해 주세요': ['カードを選んでください', '请选择卡', 'Please choose a card'],
    '등록된 카드가 없어요': ['登録されたカードはありません', '还没有登记的卡', 'No cards registered'],
    '지정된 카드가 없어요. 카드를 골라 주세요': ['カードが指定されていません。カードを選んでください', '还没有指定卡。请选择卡', 'No card is set. Please choose a card'],
    '카드 목록은 관리자가 설정에서 등록해요': ['カードは管理者が設定で登録します', '卡由管理员在设置里登记', 'Cards are registered by the admin in Settings'],
    'jpg, jpeg, png 파일만 올릴 수 있어요': ['jpg、jpeg、png のファイルだけアップロードできます', '只能上传 jpg、jpeg、png 文件', 'Only jpg, jpeg and png files can be uploaded'],
    ' · 새 파일을 고르면 지금 이미지가 바뀌어요': [' · 新しいファイルを選ぶと今の画像が変わります', ' · 选择新文件后会替换当前图片', ' · Choosing a new file replaces the current image'],
    '현재 소재 이미지': ['現在の画像', '当前图片', 'Current image'],
    '선택한 소재 미리보기': ['選んだ画像のプレビュー', '所选图片预览', 'Preview of the selected image'],
    '작성자 이름': ['入力した人の名前', '填写人姓名', 'Your name'],
    '수정 이력에 남을 이름': ['変更履歴に残る名前', '会记录在修改记录里的名字', 'Name shown in the change log'],
    '팀 공용 계정이라 누가 바꿨는지 이름을 남겨 주세요': ['チーム共用のアカウントなので、誰が変えたか名前を残してください', '这是小组共用账号，请留下名字以便知道是谁修改的', 'This is a shared team account, so please leave your name to show who made the change'],
    '종료일이 시작일보다 빨라요. 날짜를 확인해 주세요.': ['終了日が開始日より前です。日付を確認してください。', '结束日期早于开始日期。请确认日期。', 'The end date is before the start date. Please check the dates.'],
    '종료로 바꾸려면 종료일을 넣어 주세요.': ['終了にするには終了日を入れてください。', '改为结束时请填写结束日期。', 'To mark it as ended, please enter an end date.'],
    '소재 이미지를 넣어 주세요 (jpg, jpeg, png)': ['広告の画像を入れてください (jpg, jpeg, png)', '请上传广告图片 (jpg, jpeg, png)', 'Please add an ad image (jpg, jpeg, png)'],
    '광고는 등록했지만 이미지를 올리지 못했어요. 광고 정보 수정에서 다시 올려 주세요.': ['広告は登録しましたが、画像をアップロードできませんでした。「広告情報の修正」からもう一度アップロードしてください。', '广告已登记，但图片上传失败。请在"修改广告信息"里重新上传。', 'The ad was added, but the image could not be uploaded. Please upload it again from "Edit ad".'],
    '광고 정보를 저장했어요': ['広告情報を保存しました', '广告信息已保存', 'Ad saved'],
    '광고를 등록했어요': ['広告を登録しました', '广告已登记', 'Ad added'],
    '이미지를 읽지 못했어요. 다른 파일로 시도해 주세요.': ['画像を読み込めませんでした。別のファイルでお試しください。', '无法读取图片。请换一个文件再试。', 'Could not read the image. Please try another file.'],

    // ---- 성과 입력 ----
    '{name} 성과 입력': ['{name} の成果入力', '{name} 填写成果', 'Enter results: {name}'],
    '주 시작일 (월요일)': ['週の開始日 (月曜日)', '周开始日 (周一)', 'Week start (Monday)'],
    '다른 요일을 골라도 그 주 월요일로 맞춰져요': ['ほかの曜日を選んでも、その週の月曜日に合わせます', '选其他日子也会自动调整为该周周一', 'Any day you pick is adjusted to the Monday of that week'],
    '입력 기간': ['入力期間', '填写期间', 'Period'],
    '이미 입력된 주예요. 저장하면 새 숫자로 바뀌어요.': ['すでに入力された週です。保存すると新しい数字に変わります。', '这一周已经填写过。保存后会替换成新的数字。', 'This week already has numbers. Saving replaces them.'],
    '매체 광고 관리자 화면에서 같은 기간의 숫자를 그대로 옮겨 적어 주세요.': ['媒体の広告管理画面で、同じ期間の数字をそのまま写してください。', '请把媒体广告后台里同一期间的数字原样抄过来。', "Copy the numbers for the same period from the platform's ads manager."],
    '광고비 ({cur})': ['広告費 ({cur})', '广告费 ({cur})', 'Spend ({cur})'],
    '노출수': ['表示回数', '展示次数', 'Impressions'],
    '클릭수': ['クリック数', '点击次数', 'Clicks'],
    '전환수 (구매)': ['成果の数 (購入)', '转化次数 (购买)', 'Conversions (purchases)'],
    '전환수 (상담·신청)': ['成果の数 (相談・申し込み)', '转化次数 (咨询·申请)', 'Conversions (inquiries, sign-ups)'],
    '매출 ({cur})': ['売上 ({cur})', '销售额 ({cur})', 'Revenue ({cur})'],
    ' · 없으면 0': [' · なければ0', ' · 没有填0', ' · 0 if none'],
    '팀 공용 계정이라 누가 입력했는지 이름을 남겨 주세요': ['チーム共用のアカウントなので、誰が入力したか名前を残してください', '这是小组共用账号，请留下名字以便知道是谁填写的', 'This is a shared team account, so please leave your name to show who entered this'],
    '{month} 누적 기준 예상 판정': ['{month}の累計での予想判定', '按{month}累计的预计判定', 'Expected rating on {month} totals'],
    '주 시작일을 골라 주세요': ['週の開始日を選んでください', '请选择周开始日', 'Please choose the week start date'],
    '광고비를 입력해 주세요': ['広告費を入力してください', '请填写广告费', 'Please enter the spend'],
    '클릭수가 노출수보다 많아요. 숫자를 확인해 주세요.': ['クリック数が表示回数より多いです。数字を確認してください。', '点击次数比展示次数多。请确认数字。', 'Clicks are higher than impressions. Please check the numbers.'],
    '저장했어요 · {month} 판정: {grade}': ['保存しました · {month}の判定: {grade}', '已保存 · {month}判定: {grade}', 'Saved · Rating for {month}: {grade}'],

    // ---- 수정 이력 ----
    '누가 언제 무엇을 바꿨는지 · 최근 300건': ['誰がいつ何を変えたか · 直近300件', '谁在什么时候改了什么 · 最近300条', 'Who changed what and when · Latest 300'],
    '기록이 없어요': ['記録はありません', '没有记录', 'No records'],
    '팀 공용 계정이라 이름은 입력한 사람이 직접 적은 값이에요.': ['チーム共用のアカウントなので、名前は入力した人が自分で書いたものです。', '这是小组共用账号，名字是填写人自己写的。', 'These are shared team accounts, so names are whatever the person typed.'],
    '기록 내용은 한국어로 남아요.': ['記録の内容は韓国語で残ります。', '记录内容以韩语保存。', 'Log entries are recorded in Korean.'],

    // ---- 설정 ----
    '관리자만 볼 수 있어요': ['管理者だけが見られます', '只有管理员可以查看', 'Only the admin can see this'],
    '매체별 판정 기준': ['媒体ごとの判定基準', '各媒体判定标准', 'Rating standards by platform'],
    '지금 값은 예시예요. 첫 한 달 데이터를 보고 조정해 주세요. CPC는 원화 기준이고, 바꾸면 모든 광고에 바로 적용돼요.': ['今の値は例です。最初の1か月のデータを見て調整してください。CPCはウォン基準で、変えるとすべての広告にすぐ反映されます。', '现在的数值是示例。请看第一个月的数据后调整。CPC以韩元为准，修改后立即应用到所有广告。', 'These are example values. Adjust them after the first month of data. CPC is in KRW, and changes apply to all ads right away.'],
    '판매 광고 · ROAS (배)': ['販売広告 · ROAS (倍)', '销售广告 · ROAS (倍)', 'Sales ads · ROAS (x)'],
    '유입 광고 · CPC (원)': ['集客広告 · CPC (ウォン)', '引流广告 · CPC (韩元)', 'Traffic ads · CPC (KRW)'],
    '최상 (이상)': ['最良 (以上)', '最佳 (以上)', 'Best (at least)'],
    '양호 (이상)': ['良好 (以上)', '良好 (以上)', 'Good (at least)'],
    '최상 (이하)': ['最良 (以下)', '最佳 (以下)', 'Best (at most)'],
    '양호 (이하)': ['良好 (以下)', '良好 (以下)', 'Good (at most)'],
    '클릭이': ['クリックが', '点击少于', 'Fewer than'],
    '회 미만이면': ['回未満なら', '次时', 'clicks →'],
    '판단 보류 클릭 수': ['判定保留のクリック数', '暂不判定的点击数', 'Clicks needed before rating'],
    '기준 저장': ['基準を保存', '保存标准', 'Save standards'],
    '원화 환산 환율': ['ウォン換算レート', '折合韩元汇率', 'Exchange rates to KRW'],
    '예시 값이에요. 한 달에 한 번 정도 실제 환율로 바꿔 주세요.': ['例の値です。月に1回くらい実際のレートに変えてください。', '这是示例数值。请大约每月一次改成实际汇率。', 'These are example values. Update them to real rates about once a month.'],
    '원': ['ウォン', '韩元', 'KRW'],
    '환율 저장': ['レートを保存', '保存汇率', 'Save rates'],
    '카드 번호 전체는 저장하지 않아요. 별칭과 끝 4자리만 적어 주세요.': ['カード番号の全部は保存しません。呼び名と下4桁だけ書いてください。', '不保存完整卡号。只填写别名和末4位。', 'The full card number is never stored. Enter a nickname and the last 4 digits only.'],
    '별칭 (예: 법인 신한)': ['呼び名 (例: 法人カードA)', '别名 (例: 公司卡A)', 'Nickname (e.g. Corporate card A)'],
    '카드 별칭': ['カードの呼び名', '卡别名', 'Card nickname'],
    '끝 4자리': ['下4桁', '末4位', 'Last 4 digits'],
    '카드 끝 4자리': ['カードの下4桁', '卡号末4位', 'Last 4 digits of the card'],
    '카드 추가': ['カードを追加', '添加卡', 'Add card'],
    '계정 비밀번호': ['アカウントのパスワード', '账号密码', 'Account passwords'],
    '숫자 4자리예요. 바꾸면 그 계정으로 접속해 있던 사람은 1시간 안에 접속이 끊기고, 새 비밀번호로 다시 들어와야 해요.': ['数字4桁です。変えると、そのアカウントでログインしていた人は1時間以内に接続が切れ、新しいパスワードでログインし直す必要があります。', '4位数字。修改后，正在使用该账号的人会在1小时内被断开，需要用新密码重新登录。', '4 digits. After a change, anyone signed in with that account is disconnected within 1 hour and must sign in with the new password.'],
    '새 4자리': ['新しい4桁', '新的4位数字', 'New 4 digits'],
    '{name} 새 비밀번호': ['{name} の新しいパスワード', '{name} 的新密码', 'New password for {name}'],
    '{name}: ROAS 최상 기준은 양호 기준보다 커야 해요': ['{name}: ROASの最良の基準は良好の基準より大きくしてください', '{name}: ROAS最佳标准必须高于良好标准', '{name}: the Best ROAS standard must be higher than the Good standard'],
    '{name}: CPC 최상 기준은 양호 기준보다 작아야 해요': ['{name}: CPCの最良の基準は良好の基準より小さくしてください', '{name}: CPC最佳标准必须低于良好标准', '{name}: the Best CPC standard must be lower than the Good standard'],
    '판정 기준을 저장했어요. 모든 광고에 바로 적용돼요': ['判定基準を保存しました。すべての広告にすぐ反映されます', '判定标准已保存。立即应用到所有广告', 'Rating standards saved. They apply to all ads right away'],
    '환율은 0보다 커야 해요': ['レートは0より大きくしてください', '汇率必须大于0', 'Rates must be greater than 0'],
    '환율을 저장했어요': ['レートを保存しました', '汇率已保存', 'Rates saved'],
    '끝 4자리 숫자만 적어 주세요': ['下4桁の数字だけ書いてください', '请只填写末4位数字', 'Enter the last 4 digits only'],
    '카드를 추가했어요': ['カードを追加しました', '卡已添加', 'Card added'],
    '{label} 카드를 삭제할까요?': ['{label} のカードを削除しますか？', '要删除 {label} 这张卡吗？', 'Delete the card {label}?'],
    '이 카드를 쓰던 광고 {n}개는 "카드를 지정해 주세요"로 표시돼요.': ['このカードを使っていた広告{n}件は「カードを指定してください」と表示されます。', '使用这张卡的{n}个广告会显示"请指定卡"。', '{n} ads using this card will show "Please set a card".'],
    '카드를 삭제하지 못했어요. 잠시 뒤 다시 시도해 주세요.': ['カードを削除できませんでした。しばらくしてからもう一度お試しください。', '删除卡失败。请稍后再试。', 'Could not delete the card. Please try again shortly.'],
    '카드를 삭제했어요': ['カードを削除しました', '卡已删除', 'Card deleted'],
    '숫자 4자리를 입력해 주세요': ['数字4桁を入力してください', '请输入4位数字', 'Please enter 4 digits'],
    '{name} 계정의 비밀번호를 바꿀까요?': ['{name} のパスワードを変えますか？', '要修改 {name} 的密码吗？', 'Change the password for {name}?'],
    '바꾸면 지금 바로 다시 로그인해야 해요.': ['変えると、すぐにログインし直す必要があります。', '修改后需要马上重新登录。', 'You will have to sign in again right away.'],
    '그 계정으로 접속해 있던 사람은 다시 로그인해야 해요.': ['そのアカウントでログインしていた人は、ログインし直す必要があります。', '正在使用该账号的人需要重新登录。', 'Anyone signed in with that account will have to sign in again.'],
    '비밀번호를 바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.': ['パスワードを変更できませんでした。しばらくしてからもう一度お試しください。', '修改密码失败。请稍后再试。', 'Could not change the password. Please try again shortly.'],
    '{name} 비밀번호를 바꿨어요': ['{name} のパスワードを変更しました', '{name} 的密码已修改', 'Password changed for {name}'],
  };

  // 팀 · 매체 · 계정 이름: DB에는 한국어 이름이 있고, 다른 언어에서는 여기 이름으로 보여 줌 (없으면 DB 이름 그대로)
  const NAMES = {
    team: {
      'cos-kr': ['化粧品_国内広告', '化妆品_国内广告', 'Cosmetics_Domestic Ads'],
      'cos-global': ['化粧品_海外広告', '化妆品_海外广告', 'Cosmetics_Overseas Ads'],
      'clinic-cn': ['クリニック_中国', '诊所_中国', 'Clinic_China'],
      'clinic-jp': ['クリニック_日本', '诊所_日本', 'Clinic_Japan'],
      'global-clinic': ['グローバルチーム_clinic', '全球组_clinic', 'Global Team_clinic'],
      'global-cos': ['グローバルチーム_cosmetic', '全球组_cosmetic', 'Global Team_cosmetic'],
    },
    media: {
      meta: ['Meta', 'Meta', 'Meta'],
      google: ['Google', 'Google', 'Google'],
      tiktok: ['TikTok', 'TikTok', 'TikTok'],
      amazon: ['Amazon', 'Amazon', 'Amazon'],
      x: ['X(旧Twitter)', 'X(原Twitter)', 'X (formerly Twitter)'],
    },
    account: {
      ceo: ['代表', '代表', 'CEO'],
      admin: ['管理者', '管理员', 'Admin'],
      'cos-kr': ['化粧品_国内広告', '化妆品_国内广告', 'Cosmetics_Domestic Ads'],
      'cos-global': ['化粧品_海外広告', '化妆品_海外广告', 'Cosmetics_Overseas Ads'],
      'clinic-cn': ['クリニック_中国チーム', '诊所_中国组', 'Clinic_China Team'],
      'clinic-jp': ['クリニック_日本チーム', '诊所_日本组', 'Clinic_Japan Team'],
      'global-clinic': ['グローバルチーム_clinic', '全球组_clinic', 'Global Team_clinic'],
      'global-cos': ['グローバルチーム_cosmetic', '全球组_cosmetic', 'Global Team_cosmetic'],
    },
  };

  const missing = new Set();
  function T(s, vars) {
    let out = s;
    if (lang !== 'ko') {
      const hit = DICT[s]?.[IDX[lang]];
      if (hit == null) missing.add(s); else out = hit;
    }
    return vars ? out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : out;
  }
  const TN = (kind, id, fallback) => (lang === 'ko' ? fallback : NAMES[kind]?.[id]?.[IDX[lang]] ?? fallback);

  function setLang(v) {
    if (!LANGS[v] || v === lang) return;
    try { localStorage.setItem(KEY, v); } catch (e) { /* 편의 기능 */ }
    location.reload();
  }

  // HTML에 적힌 한국어 문구 바꾸기: data-i18n(글자), data-i18n-ph(입력칸 안내), data-i18n-aria(설명)
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
  document.title = T(document.title);
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = T(el.textContent.trim()); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = T(el.placeholder); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', T(el.getAttribute('aria-label'))); });
  document.querySelectorAll('select[data-lang-select]').forEach((sel) => {
    sel.innerHTML = Object.entries(LANGS).map(([v, l]) => `<option value="${v}"${v === lang ? ' selected' : ''}>${l}</option>`).join('');
    sel.addEventListener('change', () => setLang(sel.value));
  });

  window.T = T;
  window.TN = TN;
  window.I18N = { lang, langs: LANGS, setLang, missing, monthName: (m) => MONTH_EN[m - 1] ?? String(m) };
})();
