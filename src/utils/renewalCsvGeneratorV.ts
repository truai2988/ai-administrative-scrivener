import Encoding from 'encoding-japanese';
import { z } from 'zod';
import { renewalApplicationSchema } from '@/lib/schemas/renewalApplicationSchema';

type RenewalApplicationFormData = z.infer<typeof renewalApplicationSchema>;

const escapeCsvString = (val: string | number | boolean | null | undefined): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const formatBoolean = (val: boolean | undefined): string => {
  if (val === undefined) return '';
  return val ? '有' : '無';
};

export const generateRenewalCsvV = (data: RenewalApplicationFormData): Uint8Array => {
    const headers = [
    '申請人に関する情報等_技能水準_評価区分',
    '申請人に関する情報等_技能水準_合格した試験名',
    '申請人に関する情報等_技能水準_受験地',
    '申請人に関する情報等_技能水準_合格した試験名',
    '申請人に関する情報等_技能水準_受験地',
    '申請人に関する情報等_技能水準_合格した試験名',
    '申請人に関する情報等_技能水準_受験地',
    '申請人に関する情報等_技能水準_その他の評価方法による証明',
    '申請人に関する情報等_日本語能力_評価区分',
    '申請人に関する情報等_日本語能力_合格した試験名',
    '申請人に関する情報等_日本語能力_受験地',
    '申請人に関する情報等_日本語能力_合格した試験名',
    '申請人に関する情報等_日本語能力_受験地',
    '申請人に関する情報等_日本語能力_合格した試験名',
    '申請人に関する情報等_日本語能力_受験地',
    '申請人に関する情報等_日本語能力_その他の評価方法による証明',
    '申請人に関する情報等_良好に修了した技能実習2号１_良好に修了した技能実習2号_職種・作業_職種',
    '申請人に関する情報等_良好に修了した技能実習2号１_良好に修了した技能実習2号_職種・作業_作業',
    '申請人に関する情報等_良好に修了した技能実習2号１_良好に修了した技能実習2号_職種・作業_良好に修了したことの証明',
    '申請人に関する情報等_良好に修了した技能実習2号２_良好に修了した技能実習2号_職種・作業_職種',
    '申請人に関する情報等_良好に修了した技能実習2号２_良好に修了した技能実習2号_職種・作業_作業',
    '申請人に関する情報等_良好に修了した技能実習2号２_良好に修了した技能実習2号_職種・作業_良好に修了したことの証明',
    '申請人に関する情報等_申請時における特定技能1号での通算在留期間(年数)',
    '申請人に関する情報等_申請時における特定技能1号での通算在留期間(月数)',
    '申請人に関する情報等_特定技能雇用契約に係る保証金の徴収その他財産管理又は違約金等の支払契約の有無',
    '申請人に関する情報等_徴収・管理機関名',
    '申請人に関する情報等_徴収金額・管理財産',
    '申請人に関する情報等_取次ぎ又は活動準備に関する外国の機関への費用支払について、合意していることの有無',
    '申請人に関する情報等_外国の機関名',
    '申請人に関する情報等_支払額',
    '申請人に関する情報等_国籍国等において定められる本邦で行う活動に関連して遵守すべき手続を経ていることの有無',
    '申請人に関する情報等_本邦において定期的に負担する費用について、対価の内容を十分に理解して合意していることの有無',
    '申請人に関する情報等_技能実習によって本邦において修得、習熟又は熟達した技能等の本国への移転に努めることの有無',
    '申請人に関する情報等_申請人につき特定産業分野に特有の事情に鑑みて告示で定められる基準に適合していることの有無',
    '申請人に関する情報等_職歴の有無',
    '申請人に関する情報等_職歴１_職歴_入社_年月',
    '申請人に関する情報等_職歴１_職歴_退社_年月',
    '申請人に関する情報等_職歴１_職歴_勤務先_名称',
    '申請人に関する情報等_職歴２_職歴_入社_年月',
    '申請人に関する情報等_職歴２_職歴_退社_年月',
    '申請人に関する情報等_職歴２_職歴_勤務先_名称',
    '申請人に関する情報等_職歴３_職歴_入社_年月',
    '申請人に関する情報等_職歴３_職歴_退社_年月',
    '申請人に関する情報等_職歴３_職歴_勤務先_名称',
    '申請人に関する情報等_職歴４_職歴_入社_年月',
    '申請人に関する情報等_職歴４_職歴_退社_年月',
    '申請人に関する情報等_職歴４_職歴_勤務先_名称',
    '申請人に関する情報等_職歴５_職歴_入社_年月',
    '申請人に関する情報等_職歴５_職歴_退社_年月',
    '申請人に関する情報等_職歴５_職歴_勤務先_名称',
    '申請人に関する情報等_職歴６_職歴_入社_年月',
    '申請人に関する情報等_職歴６_職歴_退社_年月',
    '申請人に関する情報等_職歴６_職歴_勤務先_名称',
    '申請人に関する情報等_職歴７_職歴_入社_年月',
    '申請人に関する情報等_職歴７_職歴_退社_年月',
    '申請人に関する情報等_職歴７_職歴_勤務先_名称',
    '申請人に関する情報等_職歴８_職歴_入社_年月',
    '申請人に関する情報等_職歴８_職歴_退社_年月',
    '申請人に関する情報等_職歴８_職歴_勤務先_名称',
    '申請人に関する情報等_職歴９_職歴_入社_年月',
    '申請人に関する情報等_職歴９_職歴_退社_年月',
    '申請人に関する情報等_職歴９_職歴_勤務先_名称',
    '申請人に関する情報等_職歴１０_職歴_入社_年月',
    '申請人に関する情報等_職歴１０_職歴_退社_年月',
    '申請人に関する情報等_職歴１０_職歴_勤務先_名称',
    '代理人（法定代理人による申請の場合に記入）_代理人_(1)氏名',
    '代理人（法定代理人による申請の場合に記入）_代理人_(2)本人との関係',
    '代理人（法定代理人による申請の場合に記入）_代理人_(3)郵便番号',
    '代理人（法定代理人による申請の場合に記入）_代理人_(3)住所(都道府県)',
    '代理人（法定代理人による申請の場合に記入）_代理人_(3)住所(市区町村)',
    '代理人（法定代理人による申請の場合に記入）_代理人_(3)住所(町名丁目番地号等)',
    '代理人（法定代理人による申請の場合に記入）_代理人_(3)電話番号',
    '代理人（法定代理人による申請の場合に記入）_代理人_(3)携帯電話番号',
    '取次者_取次者(オンラインシステム利用者)_(1)氏名',
    '取次者_取次者_(2)郵便番号',
    '取次者_取次者_(2)住所(都道府県)',
    '取次者_取次者_(2)住所(市区町村)',
    '取次者_取次者_(2)住所(町名丁目番地号等)',
    '取次者_取次者_(3)所属機関等',
    '取次者_取次者_(3)電話番号',
    '所属機関に関する情報等_特定技能雇用契約_(1)雇用契約期間(始期)',
    '所属機関に関する情報等_特定技能雇用契約_(1)雇用契約期間(終期)',
    '所属機関に関する情報等_特定産業分野１_特定技能雇用契約_(2)従事すべき業務の内容_特定産業分野',
    '所属機関に関する情報等_特定産業分野１_特定技能雇用契約_(2)従事すべき業務の内容_業務区分',
    '所属機関に関する情報等_特定産業分野２_特定技能雇用契約_(2)従事すべき業務の内容_特定産業分野',
    '所属機関に関する情報等_特定産業分野２_特定技能雇用契約_(2)従事すべき業務の内容_業務区分',
    '所属機関に関する情報等_特定産業分野３_特定技能雇用契約_(2)従事すべき業務の内容_特定産業分野',
    '所属機関に関する情報等_特定産業分野３_特定技能雇用契約_(2)従事すべき業務の内容_業務区分',
    '所属機関に関する情報等_特定技能雇用契約_(2)従事すべき業務の内容_職種_主たる職種',
    '所属機関に関する情報等_他職種１_特定技能雇用契約_(2)従事すべき業務の内容_職種_他職種',
    '所属機関に関する情報等_他職種２_特定技能雇用契約_(2)従事すべき業務の内容_職種_他職種',
    '所属機関に関する情報等_他職種３_特定技能雇用契約_(2)従事すべき業務の内容_職種_他職種',
    '所属機関に関する情報等_特定技能雇用契約_(3)所定労働時間(週平均）',
    '所属機関に関する情報等_特定技能雇用契約_(3)所定労働時間(月平均）',
    '所属機関に関する情報等_特定技能雇用契約_(3)所定労働時間が通常の労働者の所定労働時間と同等であることの有無',
    '所属機関に関する情報等_特定技能雇用契約_(4)月額報酬',
    '所属機関に関する情報等_特定技能雇用契約_(4)基本給の時間換算額',
    '所属機関に関する情報等_特定技能雇用契約_(4)同等の業務に従事する日本人の月額報酬',
    '所属機関に関する情報等_特定技能雇用契約_(4)報酬の額が日本人が従事する場合の報酬の額と同等以上であることの有無',
    '所属機関に関する情報等_特定技能雇用契約_(5)報酬の支払方法',
    '所属機関に関する情報等_特定技能雇用契約_(6)外国人であることを理由に日本人と異なった待遇としている事項の有無',
    '所属機関に関する情報等_特定技能雇用契約_(6)外国人であることを理由に日本人と異なった待遇としている事項の有無_有_内容入力欄',
    '所属機関に関する情報等_(7)一時帰国を希望した場合に必要な有給休暇を取得させるものとしていることの有無',
    '所属機関に関する情報等_(8)雇用関係につき告示で定められる基準に適合していることの有無',
    '所属機関に関する情報等_(9)外国人が帰国旅費を負担できないとき、旅費を負担し、その他必要な措置をすることの有無',
    '所属機関に関する情報等_(10)外国人の健康の状況その他の生活の状況を把握するために必要な措置を講ずることの有無',
    '所属機関に関する情報等_(11)特定産業分野に特有の事情に鑑みて告示で定められる基準に適合していることの有無',
    '所属機関に関する情報等_特定技能雇用契約_(12)派遣先_氏名又は名称',
    '所属機関に関する情報等_特定技能雇用契約_(12)派遣先_法人番号の有無',
    '所属機関に関する情報等_特定技能雇用契約_(12)派遣先_法人番号',
    '所属機関に関する情報等_特定技能雇用契約_(12)派遣先_雇用保険適用事業所番号',
    '所属機関に関する情報等_特定技能雇用契約_(12)派遣先_住所（所在地）_郵便番号',
    '所属機関に関する情報等_特定技能雇用契約_(12)派遣先_住所（所在地）(都道府県)',
    '所属機関に関する情報等_特定技能雇用契約_(12)派遣先_住所（所在地）(市区町村)',
    '所属機関に関する情報等_特定技能雇用契約_(12)派遣先_住所（所在地）(町名丁目番地号等)',
    '所属機関に関する情報等_特定技能雇用契約_(12)派遣先_電話番号',
    '所属機関に関する情報等_特定技能雇用契約_(12)派遣先_代表者の氏名',
    '所属機関に関する情報等_特定技能雇用契約_(12)派遣先_派遣期間(始期)',
    '所属機関に関する情報等_特定技能雇用契約_(12)派遣先_派遣期間(終期)',
    '所属機関に関する情報等_特定技能雇用契約_(13)職業紹介事業者_氏名又は名称',
    '所属機関に関する情報等_特定技能雇用契約_(13)職業紹介事業者_法人番号の有無',
    '所属機関に関する情報等_特定技能雇用契約_(13)職業紹介事業者_法人番号',
    '所属機関に関する情報等_特定技能雇用契約_(13)職業紹介事業者_雇用保険適用事業所番号',
    '所属機関に関する情報等_特定技能雇用契約_(13)職業紹介事業者_住所（所在地）_郵便番号',
    '所属機関に関する情報等_特定技能雇用契約_(13)職業紹介事業者_住所（所在地）(都道府県)',
    '所属機関に関する情報等_特定技能雇用契約_(13)職業紹介事業者_住所（所在地）(市区町村)',
    '所属機関に関する情報等_特定技能雇用契約_(13)職業紹介事業者_住所（所在地）(町名丁目番地号等)',
    '所属機関に関する情報等_特定技能雇用契約_(13)職業紹介事業者_電話番号',
    '所属機関に関する情報等_特定技能雇用契約_(13)職業紹介事業者_許可・届出番号',
    '所属機関に関する情報等_特定技能雇用契約_(13)職業紹介事業者_受理年月日',
    '所属機関に関する情報等_特定技能雇用契約_(14)取次機関_氏名又は名称',
    '所属機関に関する情報等_特定技能雇用契約_(14)取次機関_国・地域',
    '所属機関に関する情報等_特定技能雇用契約_(14)取次機関_住所（所在地）_郵便番号',
    '所属機関に関する情報等_特定技能雇用契約_(14)取次機関_住所（所在地）(都道府県)',
    '所属機関に関する情報等_特定技能雇用契約_(14)取次機関_住所（所在地）(市区町村)',
    '所属機関に関する情報等_特定技能雇用契約_(14)取次機関_住所（所在地）(町名丁目番地号等)',
    '所属機関に関する情報等_特定技能雇用契約_(14)取次機関_電話番号',
    '所属機関に関する情報等_特定技能所属機関_(1)氏名又は名称',
    '所属機関に関する情報等_特定技能所属機関_(2)法人番号の有無',
    '所属機関に関する情報等_特定技能所属機関_(2)法人番号',
    '所属機関に関する情報等_特定技能所属機関_(3)雇用保険適用事業所番号',
    '所属機関に関する情報等_特定技能所属機関_(4)業種_主たる業種',
    '所属機関に関する情報等_特定技能所属機関_(4)業種_主たる業種_その他',
    '所属機関に関する情報等_他業種１_特定技能所属機関_(4)業種_他業種',
    '所属機関に関する情報等_他業種１_特定技能所属機関_(4)業種_他業種_その他',
    '所属機関に関する情報等_他業種２_特定技能所属機関_(4)業種_他業種',
    '所属機関に関する情報等_他業種２_特定技能所属機関_(4)業種_他業種_その他',
    '所属機関に関する情報等_特定技能所属機関_(5)住所（所在地）_郵便番号',
    '所属機関に関する情報等_特定技能所属機関_(5)住所（所在地）(都道府県)',
    '所属機関に関する情報等_特定技能所属機関_(5)住所（所在地）(市区町村)',
    '所属機関に関する情報等_特定技能所属機関_(5)住所（所在地）(町名丁目番地号等)',
    '所属機関に関する情報等_特定技能所属機関_(5)電話番号',
    '所属機関に関する情報等_特定技能所属機関_(6)資本金',
    '所属機関に関する情報等_特定技能所属機関_(7)年間売上金額',
    '所属機関に関する情報等_特定技能所属機関_(8)常勤職員数',
    '所属機関に関する情報等_特定技能所属機関_(9)代表者の氏名',
    '所属機関に関する情報等_特定技能所属機関_(10)勤務させる事業所名',
    '所属機関に関する情報等_特定技能所属機関_(10)勤務させる事業所_所在地_郵便番号',
    '所属機関に関する情報等_特定技能所属機関_(10)勤務させる事業所_所在地(都道府県)',
    '所属機関に関する情報等_特定技能所属機関_(10)勤務させる事業所_所在地(市区町村)',
    '所属機関に関する情報等_特定技能所属機関_(10)勤務させる事業所_所在地(町名丁目番地号等)',
    '所属機関に関する情報等_(10)勤務させる事業所が健康保険及び厚生年金保険の適用事業所であることの有無',
    '所属機関に関する情報等_(10)勤務させる事業所が労災保険及び雇用保険の適用事業所であることの有無',
    '所属機関に関する情報等_特定技能所属機関_(10)労働保険番号',
    '所属機関に関する情報等_特定技能所属機関_(11)労働、社会保険及び租税に関する法令の規定に違反したことの有無',
    '所属機関に関する情報等_特定技能所属機関_(11)労働、社会保険及び租税に関する法令の規定に違反したことの有無_有_内容入力欄',
    '所属機関に関する情報等_(12)契約締結日前1年以内又は以後に、同種の業務の労働者を非自発的に離職させたことの有無',
    '所属機関に関する情報等_(12)契約締結日前1年以内又は以後に、同種の業務の労働者を非自発的に離職させたことの有無_有_内容入力欄',
    '所属機関に関する情報等_(13)特定技能所属機関の責めに帰すべき事由により外国人の行方不明者を発生させたことの有無',
    '所属機関に関する情報等_(13)特定技能所属機関の責めに帰すべき事由により外国人の行方不明者を発生させたことの有無_有_内容入力欄',
    '所属機関に関する情報等_(14)機関・役員・支援責任者等が法令に違反して刑に処せられたことの有無',
    '所属機関に関する情報等_(14)機関・役員・支援責任者等が法令に違反して刑に処せられたことの有無_有_内容入力欄',
    '所属機関に関する情報等_(15)機関・役員・支援責任者等が精神の機能の障害を有することの有無',
    '所属機関に関する情報等_(15)機関・役員・支援責任者等が精神の機能の障害を有することの有無_有_内容入力欄',
    '所属機関に関する情報等_(16)機関・役員・支援責任者等が破産手続開始の決定を受けて復権を得ないことの有無',
    '所属機関に関する情報等_(16)機関・役員・支援責任者等が破産手続開始の決定を受けて復権を得ないことの有無_有_内容入力欄',
    '所属機関に関する情報等_(17)機関・役員等が技能実習法第16条第1項の規定により実習認定を取り消されたことの有無',
    '所属機関に関する情報等_(17)機関・役員等が技能実習法第16条第1項の規定により実習認定を取り消されたことの有無_有_内容入力欄',
    '所属機関に関する情報等_(18)機関・役員・支援責任者等が実習認定を取り消された法人の役員であったことの有無',
    '所属機関に関する情報等_(18)機関・役員・支援責任者等が実習認定を取り消された法人の役員であったことの有無_有_内容入力欄',
    '所属機関に関する情報等_(19)機関・役員・支援責任者等が法令に関し不正又は著しく不当な行為をしたことの有無',
    '所属機関に関する情報等_(19)機関・役員・支援責任者等が法令に関し不正又は著しく不当な行為をしたことの有無_有_内容入力欄',
    '所属機関に関する情報等_(20)役員・支援責任者等が暴力団員であること又は5年以内に暴力団員であったことの有無',
    '所属機関に関する情報等_(20)役員・支援責任者等が暴力団員であること又は5年以内に暴力団員であったことの有無_有_内容入力欄',
    '所属機関に関する情報等_(21)機関・役員・支援責任者等の法定代理人が(14)から(20)に該当することの有無',
    '所属機関に関する情報等_(21)機関・役員・支援責任者等の法定代理人が(14)から(20)に該当することの有無_有_内容入力欄',
    '所属機関に関する情報等_(22)暴力団員又は５年以内に暴力団員であった者がその事業活動を支配する者であることの有無',
    '所属機関に関する情報等_(22)暴力団員又は５年以内に暴力団員であった者がその事業活動を支配する者であることの有無_有_内容入力欄',
    '所属機関に関する情報等_(23)外国人の活動内容に関する文書を契約終了の日から１年以上備えて置くことの有無',
    '所属機関に関する情報等_(24)契約に係る保証金の徴収その他財産管理又は違約金等の支払契約があることの認識の有無',
    '所属機関に関する情報等_(24)契約に係る保証金の徴収その他財産管理又は違約金等の支払契約があることの認識の有無_有_内容入力欄',
    '所属機関に関する情報等_(25)特定技能雇用契約の不履行について違約金等の支払契約を締結していることの有無',
    '所属機関に関する情報等_(25)特定技能雇用契約の不履行について違約金等の支払契約を締結していることの有無_有_内容入力欄',
    '所属機関に関する情報等_(26)１号特定技能外国人支援に要する費用について、外国人に負担させないことの有無',
    '所属機関に関する情報等_特定技能所属機関_(27)次のいずれかに該当することの有無',
    '所属機関に関する情報等_(27)該当する事項_(1)派遣先において従事する業務の属する特定産業分野に係る業務又はこれに関連する業務を行っていること',
    '所属機関に関する情報等_(27)該当する事項_(1)派遣先において従事する業務の属する特定産業分野に係る業務又はこれに関連する業務を行っていること_有_内容入力欄',
    '所属機関に関する情報等_(27)該当する事項_(2)地方公共団体又は1に該当する者が資本金の過半数を出資していること',
    '所属機関に関する情報等_(27)該当する事項_(2)地方公共団体又は1に該当する者が資本金の過半数を出資していること_有_内容入力欄',
    '所属機関に関する情報等_(27)該当する事項_(3)地方公共団体又は1に該当する者が業務執行に実質的に関与していること',
    '所属機関に関する情報等_(27)該当する事項_(3)地方公共団体又は1に該当する者が業務執行に実質的に関与していること_有_内容入力欄',
    '所属機関に関する情報等_(27)該当する事項_(4)派遣先において従事する業務の属する分野が農業である場合であって国家戦略特別区域法第16条の5第1項に規定する特定機関であること',
    '所属機関に関する情報等_(28)労働者派遣をすることとしている派遣先が(11)から(22)に該当していることの有無',
    '所属機関に関する情報等_(28)労働者派遣をすることとしている派遣先が(11)から(22)に該当していることの有無_有_内容入力欄',
    '所属機関に関する情報等_特定技能所属機関_(29)労災保険加入等の措置の有無',
    '所属機関に関する情報等_特定技能所属機関_(29)労災保険加入等の措置の有無_有_内容入力欄',
    '所属機関に関する情報等_(30)特定技能雇用契約を継続して履行する体制が適切に整備されていることの有無',
    '所属機関に関する情報等_(31)外国人に現実に支払われた報酬額を振込又は確認できる方法で支払われていることの有無',
    '所属機関に関する情報等_(32)特定技能雇用契約の適正な履行の確保につき告示で定められる基準に適合することの有無',
    '所属機関に関する情報等_特定技能1号での在留を希望し登録支援機関に1号特定技能外国人支援計画の全部の実施を委託することの有無',
    '所属機関に関する情報等_特定技能所属機関_(33)支援責任者名',
    '所属機関に関する情報等_特定技能所属機関_(33)所属・役職',
    '所属機関に関する情報等_特定技能所属機関_(33)役員又は職員の中から支援責任者を選任していることの有無',
    '所属機関に関する情報等_特定技能所属機関(34)支援担当者名',
    '所属機関に関する情報等_特定技能所属機関(34)所属・役職',
    '所属機関に関する情報等_(34)役職員の中から業務に従事させる事業所ごとに1名以上の支援担当者を選任することの有無',
    '所属機関に関する情報等_特定技能所属機関_(35)次のいずれかに該当することの有無',
    '所属機関に関する情報等_(35)該当する事項_(1)過去2年間において法別表第1の1の表、2の表及び5の表の上欄の在留資格（収入を伴う事業を運営する活動又は報酬を受ける活動を行うことができる在留資格に限る）をもって在留する中長期在留者の受入れ又は管理を適正に行った実績を有すること',
    '所属機関に関する情報等_(35)該当する事項_(2)支援責任者及び支援担当者が過去2年以内に法別表第1の1の表、2の表及び5の表の上欄の在留資格（収入を伴う事業を運営する活動又は報酬を受ける活動を行うことができる在留資格に限る）をもって在留する中長期在留者の生活相談等に従事した経験を有すること',
    '所属機関に関する情報等_(35)該当する事項_(3)その他支援業務を適正に実施できる事情を有すること',
    '所属機関に関する情報等_(35)該当する事項_(3)その他支援業務を適正に実施できる事情を有すること_有_内容入力欄',
    '所属機関に関する情報等_(36)支援計画に基づく支援を、外国人が理解できる言語で行う体制を有することの有無',
    '所属機関に関する情報等_(37)支援の状況に関する文書を作成し、契約終了の日から1年以上備えて置くことの有無',
    '所属機関に関する情報等_(38)支援責任者等が支援計画の中立な実施を行える立場の者であることの有無',
    '所属機関に関する情報等_(39)適合1号特定技能外国人支援計画に基づく1号特定技能外国人支援を怠ったことの有無',
    '所属機関に関する情報等_(39)適合1号特定技能外国人支援計画に基づく1号特定技能外国人支援を怠ったことの有無_有_内容入力欄',
    '所属機関に関する情報等_(40)支援責任者等が外国人及びその監督者と定期的な面談を実施できる体制を有することの有無',
    '所属機関に関する情報等_(41)支援計画の適正な実施の確保につき告示で定める基準に適合することの有無',
    '所属機関に関する情報等_(1)出入国時に港又は飛行場への送迎をすることとしていることの有無',
    '所属機関に関する情報等_1号特定技能外国人支援計画_(2)適切な住居の確保に係る支援をすることとしていることの有無',
    '所属機関に関する情報等_(3)金融機関における預金口座等の生活に必要な契約に係る支援をすることとしていることの有無',
    '所属機関に関する情報等_(4)本邦での生活一般に関する事項等を外国人が十分に理解できる言語により実施することの有無',
    '所属機関に関する情報等_(5)関係機関への同行その他の必要な措置を講ずることとしていることの有無',
    '所属機関に関する情報等_1号特定技能外国人支援計画_(6)日本語を学習する機会を提供することとしていることの有無',
    '所属機関に関する情報等_(7)外国人が理解できる言語により相談又は苦情の申出に対して必要な措置を講ずることの有無',
    '所属機関に関する情報等_(8)外国人と日本人の交流の促進に係る支援をすることとしていることの有無',
    '所属機関に関する情報等_(9)外国人が責めに帰すべき事由によらず契約を解除される場合は、転職支援をすることの有無',
    '所属機関に関する情報等_(10)支援責任者等が定期面談を実施し、問題発生時は関係行政機関に通報することの有無',
    '所属機関に関する情報等_(11)支援計画を作成し、当該外国人にその写しを交付することとしていることの有無',
    '所属機関に関する情報等_(12)特定産業分野に特有の事情に鑑みて告示で定められる事項を支援計画に記載することの有無',
    '所属機関に関する情報等_(13)支援の内容が外国人の適正な在留に資するものであって、かつ適切に実施できることの有無',
    '所属機関に関する情報等_(14)支援計画の内容につき告示で定められる基準に適合していることの有無',
    '所属機関に関する情報等_登録支援機関_(1)氏名又は名称',
    '所属機関に関する情報等_登録支援機関_(2)法人番号の有無',
    '所属機関に関する情報等_登録支援機関_(2)法人番号',
    '所属機関に関する情報等_登録支援機関_(3)雇用保険適用事業所番号',
    '所属機関に関する情報等_登録支援機関_(4)郵便番号',
    '所属機関に関する情報等_登録支援機関_(4)所在地(都道府県)',
    '所属機関に関する情報等_登録支援機関_(4)所在地(市区町村)',
    '所属機関に関する情報等_登録支援機関_(4)所在地(町名丁目番地号等)',
    '所属機関に関する情報等_登録支援機関_(4)電話番号',
    '所属機関に関する情報等_登録支援機関_(5)代表者の氏名',
    '所属機関に関する情報等_登録支援機関_(6)登録番号',
    '所属機関に関する情報等_登録支援機関_(7)登録年月日',
    '所属機関に関する情報等_登録支援機関_(8)支援を行う事業所の名称',
    '所属機関に関する情報等_登録支援機関_(9)郵便番号',
    '所属機関に関する情報等_登録支援機関_(9)所在地(都道府県)',
    '所属機関に関する情報等_登録支援機関_(9)所在地(市区町村)',
    '所属機関に関する情報等_登録支援機関_(9)所在地(町名丁目番地号等)',
    '所属機関に関する情報等_登録支援機関_(10)支援責任者名',
    '所属機関に関する情報等_登録支援機関_(11)支援担当者名',
    '所属機関に関する情報等_登録支援機関_(12)対応可能言語',
    '所属機関に関する情報等_登録支援機関_(13)支援委託手数料(月額/人)',
  ];

  const rowData: (string | number | boolean | null | undefined)[] = [];
  const { foreignerInfo, employerInfo } = data;

  // 0-7 技能水準 (3件 + その他)
  const skillCerts = [0, 1, 2].map(i => foreignerInfo.skillCertifications?.[i] || {});
  rowData.push(
    skillCerts[0].method, skillCerts[0].examName, skillCerts[0].examLocation,
    skillCerts[1].examName, skillCerts[1].examLocation,
    skillCerts[2].examName, skillCerts[2].examLocation,
    foreignerInfo.otherSkillCert
  );

  // 8-15 日本語能力 (3件 + その他)
  const langCerts = [0, 1, 2].map(i => foreignerInfo.languageCertifications?.[i] || {});
  rowData.push(
    langCerts[0].method, langCerts[0].examName, langCerts[0].examLocation,
    langCerts[1].examName, langCerts[1].examLocation,
    langCerts[2].examName, langCerts[2].examLocation,
    foreignerInfo.otherLanguageCert
  );

  // 16-21 技能実習2号 (2件)
  const tech = [0, 1].map(i => foreignerInfo.technicalInternRecords?.[i] || {});
  rowData.push(
    tech[0].jobType, tech[0].workType, tech[0].completionProof,
    tech[1].jobType, tech[1].workType, tech[1].completionProof
  );

  // 22-23 特定技能滞在年月
  rowData.push(foreignerInfo.totalSpecificSkillStayYears, foreignerInfo.totalSpecificSkillStayMonths);

  // 24-26 保証金
  rowData.push(formatBoolean(foreignerInfo.depositCharged), foreignerInfo.depositOrganizationName, foreignerInfo.depositAmount);

  // 27-29 費用支払合意
  rowData.push(formatBoolean(foreignerInfo.feeCharged), foreignerInfo.foreignOrganizationName, foreignerInfo.feeAmount);

  // 30-33 遵守項目
  rowData.push(
    formatBoolean(foreignerInfo.followsHomeCountryProcedures),
    formatBoolean(foreignerInfo.agreesToLocalCosts),
    formatBoolean(foreignerInfo.effortsToTransferSkills),
    formatBoolean(foreignerInfo.meetsSpecificIndustryStandards)
  );

  // 34-64 職歴
  rowData.push(formatBoolean(employerInfo.hasJobHistory));
  const jobHistories = Array.from({ length: 10 }).map((_, i) => employerInfo.jobHistory?.[i] || {});
  for (const job of jobHistories) {
    rowData.push(job.startDate, job.endDate, job.companyName);
  }

  // 65-72 代理人
  const agent = foreignerInfo.agent || {};
  rowData.push(agent.name, agent.relationship, agent.zipCode, agent.prefecture, agent.city, agent.addressLines, agent.phone, agent.mobilePhone);

  // 73-79 取次者
  const rep = foreignerInfo.agencyRep || {};
  rowData.push(rep.name, rep.zipCode, rep.prefecture, rep.city, rep.addressLines, rep.organization, rep.phone);

  // 80-87 契約・産業分野 (3件)
  rowData.push(employerInfo.contractStartDate, employerInfo.contractEndDate);
  const orgInds = [0, 1, 2].map(i => employerInfo.industryFields?.[i] || "");
  const orgCats = [0, 1, 2].map(i => employerInfo.jobCategories?.[i] || "");
  rowData.push(orgInds[0], orgCats[0], orgInds[1], orgCats[1], orgInds[2], orgCats[2]);

  // 88-91 職種 (主たる + 他職種3件)
  rowData.push(employerInfo.mainJobType);
  const others = [0, 1, 2].map(i => employerInfo.otherJobTypes?.[i] || "");
  rowData.push(others[0], others[1], others[2]);

  // 92-94 労働時間
  rowData.push(employerInfo.weeklyWorkHours, employerInfo.monthlyWorkHours, formatBoolean(employerInfo.equivalentWorkHours));

  // 95-99 報酬
  // paymentMethodは 'cash' | 'bank_transfer' のため、CSV向けに整える
  const paymentMethodLabel = employerInfo.paymentMethod === 'bank_transfer' ? '預金口座への振込' : employerInfo.paymentMethod === 'cash' ? '現金支給' : employerInfo.paymentMethod;
  rowData.push(
    employerInfo.monthlySalary, employerInfo.hourlyRate, employerInfo.japaneseMonthlySalary, 
    formatBoolean(employerInfo.equivalentSalary), paymentMethodLabel
  );

  // 100-101 異なった待遇事項
  rowData.push(formatBoolean(employerInfo.hasDifferentTreatment), employerInfo.differentTreatmentDetail);

  // 102-106 誓約事項前半(7)〜(11)
  rowData.push(
    formatBoolean(employerInfo.complianceOaths.allowsTemporaryReturn),
    formatBoolean(employerInfo.complianceOaths.meetsEmploymentStandards),
    formatBoolean(employerInfo.complianceOaths.coversReturnTravelCost),
    formatBoolean(employerInfo.complianceOaths.monitorsHealthAndLife),
    formatBoolean(employerInfo.complianceOaths.meetsSpecificIndustryEmploymentStandards)
  );

  // 107-118 派遣先
  const dispatch = employerInfo.dispatchDestination;
  rowData.push(
    dispatch?.name, formatBoolean(dispatch?.hasCorporateNumber), dispatch?.corporateNumber, dispatch?.employmentInsuranceNumber,
    dispatch?.zipCode, dispatch?.prefecture, dispatch?.city, dispatch?.addressLines, dispatch?.phone, dispatch?.representativeName,
    dispatch?.periodStart, dispatch?.periodEnd
  );

  // 119-129 職業紹介事業者
  const placement = employerInfo.placementAgency;
  rowData.push(
    placement?.name, formatBoolean(placement?.hasCorporateNumber), placement?.corporateNumber, placement?.employmentInsuranceNumber,
    placement?.zipCode, placement?.prefecture, placement?.city, placement?.addressLines, placement?.phone, placement?.licenseNumber,
    placement?.acceptanceDate
  );

  // 130-136 取次機関
  const intermediary = employerInfo.intermediaryAgency || {};
  rowData.push(
    intermediary.name, intermediary.country, intermediary.zipCode, intermediary.prefecture, intermediary.city, intermediary.addressLines, intermediary.phone
  );

  // 137-142 特定技能所属機関
  rowData.push(
    employerInfo.companyNameJa, formatBoolean(employerInfo.hasCorporateNumber), employerInfo.corporateNumber, employerInfo.employmentInsuranceNumber,
    employerInfo.mainIndustry, employerInfo.mainIndustryOther
  );

  // 143-146 特定技能所属機関他業種1〜2
  const otherIndus = [0, 1].map(i => employerInfo.otherIndustries?.[i] || {});
  rowData.push(otherIndus[0].industry, otherIndus[0].industryOther, otherIndus[1].industry, otherIndus[1].industryOther);

  // 147-155 所属機関住所等
  rowData.push(
    employerInfo.companyZipCode, employerInfo.companyPref, employerInfo.companyCity, employerInfo.companyAddressLines, employerInfo.companyPhone,
    employerInfo.capital, employerInfo.annualRevenue, employerInfo.employeeCount, employerInfo.representativeName
  );

  // 156-163 勤務させる事業所
  rowData.push(
    employerInfo.workplaceName, employerInfo.workplaceZipCode, employerInfo.workplacePref, employerInfo.workplaceCity, employerInfo.workplaceAddressLines,
    formatBoolean(employerInfo.isSocialInsuranceApplicable), formatBoolean(employerInfo.isLaborInsuranceApplicable), employerInfo.laborInsuranceNumber
  );

  // 164-187 誓約事項中盤(11)〜(22) (各2件：有無・内容)
  const oaths = employerInfo.complianceOaths || {};
  const complianceFields: (keyof typeof oaths)[] = [
    'hadLaborLawPenalty', 'hadInvoluntaryDismissal', 'hadMissingPersons', 'hadCriminalPenalty', 'hasMentalImpairment',
    'hasBankruptcy', 'hadTechnicalInternRevocation', 'wasOfficerOfRevokedEntity', 'hadIllegalAct', 'hadGangsterRelation',
    'legalRepresentativeQualifies', 'isGangControlled'
  ];
  for (const field of complianceFields) {
    const obj = oaths[field] as { applies?: boolean, detail?: string } | undefined;
    rowData.push(formatBoolean(obj?.applies), obj?.detail);
  }

  // 188 (23) 文書備え置き
  rowData.push(formatBoolean(oaths.keepsActivityRecords));

  // 189-192 (24)〜(25) 違約金関連 (有無・内容)
  rowData.push(
    formatBoolean(oaths.awaresOfGuaranteeContract?.applies), oaths.awaresOfGuaranteeContract?.detail,
    formatBoolean(oaths.hasCompliancePenaltyContract?.applies), oaths.hasCompliancePenaltyContract?.detail
  );

  // 193 (26) 費用負担
  rowData.push(formatBoolean(oaths.noSupportCostBurdenOnForeigner));

  // 194-201 (27) 派遣等要件
  const dq = employerInfo.dispatchQualification || {};
  rowData.push(
    formatBoolean(dq.applies),
    formatBoolean(dq.doesSpecificIndustryBusiness), dq.doesSpecificIndustryBusinessDetail,
    formatBoolean(dq.publicBodyCapitalMajority), dq.publicBodyCapitalMajorityDetail,
    formatBoolean(dq.publicBodyManagementInvolvement), dq.publicBodyManagementInvolvementDetail,
    formatBoolean(dq.isAgricultureSpecialZoneEntity)
  );

  // 202-203 (28) 派遣先該当有無
  rowData.push(formatBoolean(employerInfo.dispatchDestinationDisqualification?.applies), employerInfo.dispatchDestinationDisqualification?.detail);

  // 204-205 (29) 労災措置
  rowData.push(formatBoolean(employerInfo.hasWorkersCompMeasures?.applies), employerInfo.hasWorkersCompMeasures?.detail);

  // 206-208 (30)〜(32)
  rowData.push(
    formatBoolean(oaths.hasContractContinuationSystem),
    formatBoolean(oaths.paysWageByTransfer),
    formatBoolean(oaths.meetsAdditionalEmploymentStandards)
  );

  // 209 委託フラグ
  rowData.push(formatBoolean(employerInfo.delegateSupportEntirely));

  // 210-215 (33)〜(34) 支援責任者・担当者
  rowData.push(
    employerInfo.supportPersonnel?.supervisorName,
    employerInfo.supportPersonnel?.supervisorTitle,
    formatBoolean(employerInfo.supportPersonnel?.isSupervisorFromStaff),
    employerInfo.supportPersonnel?.officerName,
    employerInfo.supportPersonnel?.officerTitle,
    formatBoolean(employerInfo.supportPersonnel?.isOfficerFromStaff)
  );

  // 216-220 (35) 実績・適正要件
  rowData.push(
    formatBoolean(employerInfo.qualifiedForSupportWork),
    formatBoolean(employerInfo.supportWorkQualification1),
    formatBoolean(employerInfo.supportWorkQualification2),
    formatBoolean(employerInfo.supportWorkQualification3),
    employerInfo.supportWorkQualification3Detail
  );

  // 221-227 (36)〜(41) 支援体制
  rowData.push(
    formatBoolean(employerInfo.hasForeignLanguageSupportCapability),
    formatBoolean(employerInfo.keepsSupportRecords),
    formatBoolean(employerInfo.supportersNeutral),
    formatBoolean(employerInfo.hadSupportNeglect?.applies), employerInfo.hadSupportNeglect?.detail,
    formatBoolean(employerInfo.hasRegularMeetingCapability),
    formatBoolean(employerInfo.meetsSpecificIndustrySupportStandards)
  );
  
  // 228-243 支援計画
  const sPlan = employerInfo.supportPlan;
  rowData.push(
    formatBoolean(sPlan?.airportPickup),
    formatBoolean(sPlan?.housingSupport),
    formatBoolean(sPlan?.financialContractSupport),
    formatBoolean(sPlan?.lifeInfoProvision),
    formatBoolean(sPlan?.adminProcedureEscort),
    formatBoolean(sPlan?.japaneseLanguageLearning),
    formatBoolean(sPlan?.complaintSupport),
    formatBoolean(sPlan?.interculturalExchange),
    formatBoolean(sPlan?.jobChangeSupport),
    formatBoolean(sPlan?.regularInterviewAndReport),
    formatBoolean(sPlan?.writtenPlanProvision),
    formatBoolean(sPlan?.specificIndustryItems),
    formatBoolean(sPlan?.implementationCapability),
    formatBoolean(sPlan?.meetsRegulationStandards)
  );

  // 244-264 登録支援機関
  const sAgency = employerInfo.supportAgency || {};
  rowData.push(
    sAgency.name, formatBoolean(sAgency.hasCorporateNumber), sAgency.corporateNumber, sAgency.employmentInsuranceNumber,
    sAgency.zipCode, sAgency.prefecture, sAgency.city, sAgency.addressLines, sAgency.phone, sAgency.representativeName,
    sAgency.registrationNumber, sAgency.registrationDate, sAgency.supportOfficeName, sAgency.officeZipCode, sAgency.officePrefecture,
    sAgency.officeCity, sAgency.officeAddressLines, sAgency.supportSupervisorName, sAgency.supportOfficerName, sAgency.supportLanguages,
    sAgency.supportFeeMonthly
  );

  const csvString = [
    headers.map(escapeCsvString).join(','),
    rowData.map(escapeCsvString).join(','),
  ].join('\n');

  const unicodeArray = Encoding.stringToCode(csvString);
  const sjisArray = Encoding.convert(unicodeArray, 'SJIS', 'UNICODE');
  return new Uint8Array(sjisArray);
};

export const downloadRenewalCsvV = (data: RenewalApplicationFormData, filename = '申請情報入力(区分V)_1.csv') => {
  const uint8Array = generateRenewalCsvV(data);
  const blob = new Blob([uint8Array.buffer as ArrayBuffer], { type: 'text/csv' });
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  
  document.body.appendChild(a);
  a.click();
  
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
