from typing import Any, Dict, List, Optional
from app.services.advisory.advisory_types import (
    AdvisoryCategory,
    AgronomicDirective,
    FarmerAdvisoryOutput,
)


class MultilingualTemplateEngine:
    """Provides high-quality, farmer-friendly agricultural translations across all 5 supported languages:
    - Marathi (mr)
    - Hindi (hi)
    - Telugu (te)
    - English (en)
    - Kiswahili (sw)
    
    Serves as an instant, zero-latency deterministic fallback if the external LLM is offline or unconfigured.
    """

    DISCLAIMERS: Dict[str, str] = {
        "en": (
            "Notice: This advisory is an AI-assisted decision support recommendation based on meteorological models "
            "and agronomic principles. It is not a substitute for local agricultural extension consultation. "
            "Never apply chemical pesticides without consulting your local Krishi Vigyan Kendra (KVK) or extension officer."
        ),
        "mr": (
            "सूचना: हा सल्ला हवामान मॉडेल आणि कृषी तत्त्वांवर आधारित एक कृषी निर्णय सहाय्यक सल्ला आहे. "
            "हा स्थानिक कृषी अधिकाऱ्यांच्या मार्गदर्शनाचा पर्याय नाही. स्थानिक कृषी विज्ञान केंद्र (KVK) किंवा कृषी अधिकाऱ्यांचा "
            "सल्ला घेतल्याशिवाय रासायनिक कीटकनाशकांचा वापर करू नका."
        ),
        "hi": (
            "सूचना: यह सलाह मौसम संबंधी मॉडल और कृषि सिद्धांतों पर आधारित एक निर्णय समर्थन सिफारिश है। "
            "यह स्थानीय कृषि विशेषज्ञों के परामर्श का विकल्प नहीं है। बिना स्थानीय कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी "
            "की सलाह के किसी भी रासायनिक कीटनाशक का प्रयोग न करें।"
        ),
        "te": (
            "గమనిక: ఈ సలహా వాతావరణ నమూనాలు మరియు వ్యవసాయ సూత్రాల ఆధారంగా రూపొందించబడిన నిర్ణయ మద్దతు సిఫార్సు. "
            "ఇది స్థానిక వ్యవసాయ అధికారుల సంప్రదింపులకు ప్రత్యామ్నాయం కాదు. మీ స్థానిక కృషి విజ్ఞాన కేంద్రం (KVK) లేదా "
            "వ్యవసాయ అధికారిని సంప్రదించకుండా ఎటువంటి రసాయన పురుగుమందులను పిచికారీ చేయవద్దు."
        ),
        "sw": (
            "Taarifa: Ushauri huu ni mapendekezo ya kusaidia maamuzi kulingana na mifumo ya hali ya hewa na kanuni za kilimo. "
            "Si mbadala wa kushauriana na afisa ugani wa kilimo wa eneo lako. Usitumie viuatilifu vya kemikali bila "
            "kushauriana na afisa wa kilimo aliyeidhinishwa."
        ),
    }

    DATA_LIMITATIONS: Dict[str, str] = {
        "en": "In-situ root soil moisture sensor is unavailable on this plot. Advice is derived from atmospheric rainfall forecasts; check soil manually before pumping.",
        "mr": "या शेतात थेट मातीतील ओलावा मोजणारा सेन्सर उपलब्ध नाही. हा सल्ला पावसाच्या अंदाजावर आधारित आहे; सिंचनापूर्वी हाताने माती तपासा.",
        "hi": "इस खेत पर मिट्टी की नमी मापने वाला सेंसर उपलब्ध नहीं है। यह सलाह वर्षा के पूर्वानुमान पर आधारित है; पंप चलाने से पहले मिट्टी की नमी अवश्य जांचें।",
        "te": "ఈ పొలంలో నేల తేమను కొలిచే సెన్సార్ అందుబాటులో లేదు. ఈ సిఫార్సు వర్షపాత సూచనపై ఆధారపడి ఉంటుంది; నీరు పెట్టే ముందు నేలను పరిశీలించండి.",
        "sw": "Kipimo cha unyevu wa udongo hakipatikani katika shamba hili. Ushauri unatokana na utabiri wa mvua; kagua udongo kwa mkono kabla ya kumwagilia.",
    }

    @classmethod
    def translate_directive(
        cls,
        directive: AgronomicDirective,
        target_lang: str = "en",
        crop_name: str = "Crop",
        stage_name: str = "Active Stage",
    ) -> FarmerAdvisoryOutput:
        lang = target_lang.lower() if target_lang.lower() in ["mr", "hi", "te", "sw", "en"] else "en"
        category = directive.category

        # English defaults
        immediate_action = directive.immediate_action
        why_it_matters = directive.why_it_matters
        timing = directive.recommended_timing
        risk = directive.risk_if_ignored
        impact = directive.projected_impact
        action_steps = list(directive.action_steps)

        # ----------------------------------------------------------------------
        # 1. MARATHI (mr)
        # ----------------------------------------------------------------------
        if lang == "mr":
            if category == AdvisoryCategory.IRRIGATION and "pause" in directive.immediate_action.lower():
                immediate_action = f"{crop_name} पिकाचे पुढील सिंचन त्वरित थांबवा."
                why_it_matters = "पुढील २४ तासांत मुसळधार पावसाची शक्यता आहे. आता पाणी दिल्यास मुळांमध्ये हवा खेळती राहणार नाही आणि पिकाला फटका बसेल."
                timing = "पुढील २४ ते ४८ तास"
                risk = "मुळांना पाणी साचून कुज निर्माण होणे, फुलगळ होणे आणि वीज/पाण्याचा नाहक खर्च."
                impact = "पाणी व वीज खर्च वाचेल, खतांचा निचरा टळेल आणि मुळांचे नुकसान रोखले जाईल."
                action_steps = [
                    "ठिबक किंवा कालव्याचे सिंचन तात्काळ बंद करा.",
                    "शेतातील अतिरिक्त पाण्याचा निचरा होण्यासाठी बांधाची चर साफ करा.",
                    "पाऊस थांबल्यानंतर २४ तासांनीच जमिनीचा ओलावा तपासून पुढील सिंचनाचा निर्णय घ्या."
                ]
            elif category == AdvisoryCategory.IRRIGATION and "apply" in directive.immediate_action.lower():
                immediate_action = f"सकाळच्या थंड वेळेत {crop_name} पिकाला हलके ठिबक सिंचन द्या."
                why_it_matters = "दुपारचे तापमान खूप वाढणार आहे. सकाळच्या हलक्या पाण्यामुळे जमिनीचे तापमान नियंत्रित राहून पिकाला उन्हाचा ताण बसणार नाही."
                timing = "उद्या सकाळी ५:३० ते ८:३० दरम्यान (दुपारचे ऊन पडण्यापूर्वी)"
                risk = "उष्णतेच्या लाटेमुळे पाने कोमेजणे, फुलगळ होणे आणि उत्पादनात घट."
                impact = "पिकाची टवटवीतता टिकून राहील आणि फुलगळ रोखली जाईल."
                action_steps = [
                    "फक्त पहाटे किंवा सकाळी लवकर हलके पाणी द्या.",
                    "दुपारी १२ ते ३ दरम्यान पाणी देणे टाळा, यामुळे मुळांना इजा होते."
                ]
            elif category == AdvisoryCategory.PLANT_PROTECTION and "hold" in directive.immediate_action.lower():
                immediate_action = "कोणतीही फवारणी आज करू नका, फवारणीचे काम पुढे ढकला."
                why_it_matters = "वेगाने वाहणारा वारा आणि पावसाची शक्यता यामुळे औषध हवेत उडून जाईल किंवा पावसात धुऊन वाया जाईल."
                timing = "वारा शांत होईपर्यंत (१५ किमी/तास पेक्षा कमी) फवारणी थांबवा"
                risk = "महागडी औषधे वाया जाणे आणि कीड नियंत्रणाचा शून्य फायदा."
                impact = "औषध आणि मजुरीचा १००% खर्च वाया जाण्यापासून वाचेल."
                action_steps = [
                    "आज औषध मिश्रण तयार करू नका.",
                    "वारा पूर्णपणे शांत आणि आकाश कोरडे होईपर्यंत प्रतीक्षा करा."
                ]
            elif category == AdvisoryCategory.PLANT_PROTECTION:
                immediate_action = f"{crop_name} पिकाची पाहणी करून प्रतिबंधात्मक जैविक बुरशीनाशकाची तयारी करा."
                why_it_matters = "जास्त हवेतील आर्द्रता आणि पोषक तापमानामुळे बुरशीजन्य रोगांचा प्रादुर्भाव वाढू शकतो."
                timing = "उद्या सकाळी ६:३० ते ९:०० दरम्यान (शांत हवेत)"
                risk = "पानांवर करपा किंवा भुरी रोगाचा वेगाने प्रसार होणे."
                impact = "रोगाचा प्रादुर्भाव सुरुवातीलाच रोखला जाईल."
                action_steps = [
                    "खालच्या पानांवर डाग किंवा बुरशीची लक्षणे आहेत का ते बारकाईने पहा.",
                    "ट्रायकोडर्मा किंवा ५% निंबोळी अर्काची हलकी प्रतिबंधात्मक फवारणी करा.",
                    "अधिकृत औषध आणि प्रमाणासाठी जवळच्या कृषी विज्ञान केंद्राशी (KVK) संपर्क साधा."
                ]
            elif category == AdvisoryCategory.DRAINAGE_AND_SOIL:
                immediate_action = f"{crop_name} शेतातील पाण्याच्या निचऱ्यासाठी चर आणि बांध त्वरित मोकळे करा."
                why_it_matters = "काळी चिकणमाती पाणी धरून ठेवते. पाणी साचून राहिल्यास २४ तासांत मुळे कुजतात."
                timing = "पाऊस सुरू होण्यापूर्वी त्वरित"
                risk = "पाणी साचल्यामुळे मुळांचा श्वास गुदमरणे आणि पिवळे पडणे."
                impact = "पाण्याचा त्वरित निचरा होऊन पीक सुरक्षित राहील."
                action_steps = ["शेताच्या उताराकडील बाजूस चर खोदा जेणेकरून अतिरिक्त पाणी वाहून जाईल."]
            elif category == AdvisoryCategory.HARVEST_AND_CARE:
                immediate_action = f"तयार झालेला {crop_name} माल त्वरित काढून सुरक्षित कोरड्या गोदामात हलवा."
                why_it_matters = "पावसामुळे काढणीस आलेल्या मालाला बुरशी लागून प्रत खराब होण्याची भीती आहे."
                timing = "आज दिवसभरात कोरड्या वेळेत त्वरित"
                risk = "बाजारभाव घसरणे, शेतातच माल सडणे."
                impact = "उत्पादनाचा दर्जा आणि पूर्ण बाजारभाव सुरक्षित राहील."
                action_steps = ["पक्व झालेली फळे/धान्य तात्काळ गोळा करा आणि ताडपत्रीखाली सुरक्षित ठेवा."]
            elif category == AdvisoryCategory.IRRIGATION:
                immediate_action = f"{crop_name} पिकासाठी नेहमीचे ठरलेले सिंचन वेळापत्रक सुरू ठेवा."
                why_it_matters = "सध्याची हवामान स्थिती सामान्य आहे, मोठा पाऊस किंवा उष्णतेचा ताण अपेक्षित नाही."
                timing = "शांत सकाळी किंवा संध्याकाळी उशिरा"
                risk = "कमी सिंचनामुळे पिकाच्या वाढीस विलंब होऊ शकतो."
                impact = "पीक निरोगी वाढून वेळेवर परिपक्व होईल."
                action_steps = [
                    "मातीच्या प्रकारानुसार नेहमीचे ठिबक सिंचन चक्र सुरू ठेवा.",
                    "पंप सुरू करण्यापूर्वी १० सेमी खोलीवरील मातीचा ओलावा हाताने तपासा."
                ]
            else:
                immediate_action = f"{crop_name} पिकाची नियमित पाहणी सुरू ठेवा व सल्ल्याचे पालन करा."
                why_it_matters = "सध्याचे हवामान घटक सुरक्षित मर्यादेत आहेत."
                timing = "पुढील २४ ते ४८ तास"
                risk = "नियमित पाहणी न केल्यास समस्या वेळेत लक्षात येणार नाहीत."
                impact = "पिकाचे आरोग्य व उत्पादन सुरक्षित राहील."
                action_steps = ["शेताच्या सीमेवरील भागाची पाहणी करा.", "नियोजित शेती पद्धती सुरू ठेवा."]

        # ----------------------------------------------------------------------
        # 2. HINDI (hi)
        # ----------------------------------------------------------------------
        elif lang == "hi":
            if category == AdvisoryCategory.IRRIGATION and "pause" in directive.immediate_action.lower():
                immediate_action = f"{crop_name} की फसल में अगली सिंचाई तुरंत रोकें।"
                why_it_matters = "अगले 24 घंटों में अच्छी वर्षा की संभावना है। अभी पानी देने से खेत में जलभराव होगा और जड़ों को नुकसान पहुंचेगा।"
                timing = "अगले 24 से 48 घंटे"
                risk = "जड़ों का सड़ना, फूल झड़ना और बिजली व पानी का अनावश्यक खर्च।"
                impact = "सिंचाई जल और पंप बिजली की बचत, उर्वरक का बहना रुकेगा और जड़ों को ऑक्सीजन की सुरक्षा।"
                action_steps = [
                    "ड्रिप या ट्यूबवेल पंप तुरंत बंद करें।",
                    "खेत से वर्षा जल निकासी के लिए नालियों को साफ करें।"
                ]
            elif category == AdvisoryCategory.IRRIGATION and "apply" in directive.immediate_action.lower():
                immediate_action = f"सुबह के समय {crop_name} को हल्की ड्रिप सिंचाई दें।"
                why_it_matters = "दोपहर में तापमान बहुत अधिक रहेगा। सुबह की हल्की सिंचाई से फसल को गर्मी के झटके से बचाया जा सकता है।"
                timing = "कल सुबह 5:30 से 8:30 के बीच"
                risk = "गर्मी के कारण पत्तियां मुरझाना और फूलों का झड़ना।"
                impact = "फसल की नमी बनी रहेगी और पैदावार सुरक्षित रहेगी।"
                action_steps = ["केवल सुबह जल्दी पानी दें, दोपहर की तेज धूप में सिंचाई न करें।"]
            elif category == AdvisoryCategory.PLANT_PROTECTION and "hold" in directive.immediate_action.lower():
                immediate_action = "आज किसी भी प्रकार का कीटनाशक या खाद का छिड़काव न करें।"
                why_it_matters = "तेज हवा और बारिश के कारण छिड़काव बह जाएगा या हवा में उड़कर बेकार हो जाएगा।"
                timing = "हवा शांत होने तक छिड़काव टालें"
                risk = "दवा और पैसे का पूरा नुकसान।"
                impact = "दवा और मजदूरी के व्यर्थ खर्च की 100% बचत।"
                action_steps = ["हवा की गति 15 किमी/घंटा से कम होने तक प्रतीक्षा करें।"]
            elif category == AdvisoryCategory.PLANT_PROTECTION:
                immediate_action = f"{crop_name} में जैविक फफूंदनाशक का छिड़काव करने की तैयारी करें।"
                why_it_matters = "अधिक नमी और गर्म मौसम के कारण फफूंद जनित रोगों का खतरा बढ़ गया है।"
                timing = "कल सुबह 6:30 से 9:00 बजे के बीच"
                risk = "फसल पर झुलसा या फफूंद रोग का तेजी से फैलना।"
                impact = "बीमारी को शुरुआत में ही रोककर नुकसान से बचाव।"
                action_steps = [
                    "निचली पत्तियों पर धब्बों की जांच करें।",
                    "ट्राइकोडर्मा या नीम तेल का हल्का सुरक्षात्मक छिड़काव करें।",
                    "उचित मात्रा के लिए नजदीकी कृषि विज्ञान केंद्र (KVK) से संपर्क करें।"
                ]
            elif category == AdvisoryCategory.DRAINAGE_AND_SOIL:
                immediate_action = f"{crop_name} के खेत में पानी निकासी की नालियों को तुरंत साफ करें।"
                why_it_matters = "भारी बारिश से खेत में पानी भरने पर जड़ों को सांस लेने में रुकावट होती है।"
                timing = "बारिश शुरू होने से पहले तुरंत"
                risk = "पौधे पीले पड़ना और जड़ों का घुटन से मरना।"
                impact = "अतिरिक्त पानी तेजी से निकलकर फसल सुरक्षित रहेगी।"
                action_steps = ["खेत के निचले हिस्से में जल निकासी की नाली तैयार करें।"]
            elif category == AdvisoryCategory.HARVEST_AND_CARE:
                immediate_action = f"पकी हुई {crop_name} की फसल को तुरंत काटकर सुरक्षित गोदाम में रखें।"
                why_it_matters = "बारिश के कारण पकी हुई फसल में फफूंद और सड़न का खतरा है।"
                timing = "आज दिन में तुरंत"
                risk = "उपज का सड़ना और बाजार भाव में भारी गिरावट।"
                impact = "फसल की गुणवत्ता और बाजार मूल्य पूरी तरह सुरक्षित।"
                action_steps = ["फसल को खुले खेत में न छोड़ें, तिरपाल से ढकें।"]
            elif category == AdvisoryCategory.IRRIGATION:
                immediate_action = f"{crop_name} के लिए सामान्य निर्धारित सिंचाई व्यवस्था जारी रखें।"
                why_it_matters = "मौसम की स्थिति सामान्य है, भारी बारिश या गर्मी का तनाव अपेक्षित नहीं है।"
                timing = "शांत सुबह या देर शाम के समय"
                risk = "कम सिंचाई से फसल की वृद्धि में देरी हो सकती है।"
                impact = "फसल स्वस्थ रूप से बढ़कर समय पर परिपक्व होगी।"
                action_steps = [
                    "मिट्टी के प्रकार अनुसार सामान्य ड्रिप सिंचाई चक्र जारी रखें।",
                    "पंप चलाने से पहले 10 सेमी गहराई पर मिट्टी की नमी हाथ से जांचें।"
                ]
            else:
                immediate_action = f"{crop_name} की नियमित निगरानी जारी रखें और सलाह का पालन करें।"
                why_it_matters = "वर्तमान मौसम संकेतक सुरक्षित सीमा में हैं।"
                timing = "अगले 24 से 48 घंटे"
                risk = "नियमित निगरानी न करने से समस्याओं का समय पर पता नहीं चलेगा।"
                impact = "फसल का स्वास्थ्य और उपज सुरक्षित रहेगी।"
                action_steps = ["खेत की सीमाओं की जांच करें।", "नियोजित खेती पद्धतियां जारी रखें।"]

        # ----------------------------------------------------------------------
        # 3. TELUGU (te)
        # ----------------------------------------------------------------------
        elif lang == "te":
            if category == AdvisoryCategory.IRRIGATION and "pause" in directive.immediate_action.lower():
                immediate_action = f"{crop_name} పంటకు నీటిపారుదలని తక్షణమే నిలిపివేయండి."
                why_it_matters = "రాబోయే 24 గంటల్లో భారీ వర్షం కురిసే అవకాశం ఉంది. ఇప్పుడు నీరు పెడితే వేర్లు కుళ్ళిపోతాయి."
                timing = "రాబోయే 24 నుండి 48 గంటలు"
                risk = "నీరు నిలిచిపోయి వేరు కుళ్ళు తెగులు రావడం మరియు విద్యుత్ వృధా కావడం."
                impact = "నీరు మరియు పంపు విద్యుత్ ఆదా అవుతాయి, ఎరువుల వృథా తగ్గుతుంది మరియు వేర్ల ఆరోగ్యం రక్షించబడుతుంది."
                action_steps = [
                    "బోరు లేదా డ్రిప్ పంపులను వెంటనే ఆపివేయండి.",
                    "వర్షపు నీరు బయటకు వెళ్ళడానికి పొలంలో కాలువలను శుభ్రం చేయండి."
                ]
            elif category == AdvisoryCategory.PLANT_PROTECTION and "hold" in directive.immediate_action.lower():
                immediate_action = "నేడు ఎటువంటి మందులు లేదా ఎరువుల పిచికారీ చేయవద్దు."
                why_it_matters = "ఈదురు గాలులు మరియు వర్షం కారణంగా పిచికారీ చేసిన మందు కొట్టుకుపోతుంది."
                timing = "గాలులు తగ్గే వరకు వేచి ఉండండి"
                risk = "ఖరీదైన మందులు వృధా కావడం మరియు శ్రమ నష్టం."
                impact = "మందుల ఖర్చు 100% ఆదా అవుతుంది."
                action_steps = ["గాలులు శాంతించిన తర్వాత మాత్రమే పిచికారీ చేయండి."]
            else:
                immediate_action = f"{crop_name} పంటను పరిశీలించి సలహా పాటించండి."
                why_it_matters = "వాతావరణ పరిస్థితుల వల్ల తెగుళ్ళ తీవ్రత పెరిగే అవకాశం ఉంది."
                timing = "రేపు ఉదయం వేళల్లో"
                risk = "పంట నాణ్యత దెబ్బతినడం."
                impact = "దిగుబడి రక్షణ."
                action_steps = ["సమీప కృషి విజ్ఞాన కేంద్రం (KVK) ని సంప్రదించండి."]

        # ----------------------------------------------------------------------
        # 4. KISWAHILI (sw)
        # ----------------------------------------------------------------------
        elif lang == "sw":
            if category == AdvisoryCategory.IRRIGATION and "pause" in directive.immediate_action.lower():
                immediate_action = f"Sitisha umwagiliaji kwa zao la {crop_name} mara moja."
                why_it_matters = "Mvua kubwa inatarajiwa ndani ya masaa 24 yajayo. Kumwagilia sasa kutasababisha mafuriko mizizini na kuoza."
                timing = "Masaa 24 hadi 48 yajayo"
                risk = "Mizizi kuoza kwa kukosa hewa, maua kuanguka, na kupoteza nguvu ya pampu."
                impact = "Inaokoa maji ya umwagiliaji na nishati ya pampu, inazuia mbolea kuoshwa, na inalinda mizizi dhidi ya kukosa hewa."
                action_steps = [
                    "Zima pampu za umwagiliaji mara moja.",
                    "Safisha mitaro ya shambani ili kuruhusu maji ya mvua kupita kwa urahisi."
                ]
            elif category == AdvisoryCategory.PLANT_PROTECTION and "hold" in directive.immediate_action.lower():
                immediate_action = "Usipige dawa ya majani wala mbolea ya maji leo."
                why_it_matters = "Upepo mkali na mvua inayokuja itasababisha dawa kupeperushwa au kuoshwa."
                timing = "Subiri hadi upepo utulie chini ya kilomita 15 kwa saa"
                risk = "Kupoteza pesa ya dawa na kutokuwa na matokeo yoyote."
                impact = "Inaokoa gharama zote za dawa na kazi."
                action_steps = ["Usichanganye dawa yoyote leo; subiri hali ya hewa itulie."]
            else:
                immediate_action = f"Kagua shamba la {crop_name} na uchukue tahadhari za kilimo."
                why_it_matters = "Hali ya hewa inahitaji uangalizi wa karibu kulinda mavuno."
                timing = "Asubuhi ya kesho mapema"
                risk = "Kupungua kwa mavuno na uharibifu wa zao."
                impact = "Ulinzi wa mavuno ya mkulima."
                action_steps = ["Wasiliana na afisa ugani wa kilimo wa eneo lako kwa ushauri zaidi."]

        limitations_text = cls.DATA_LIMITATIONS.get(lang, cls.DATA_LIMITATIONS["en"]) if directive.data_limitations else None
        disclaimer_text = cls.DISCLAIMERS.get(lang, cls.DISCLAIMERS["en"])

        return FarmerAdvisoryOutput(
            immediate_action=immediate_action,
            why_it_matters=why_it_matters,
            recommended_timing=timing,
            risk_if_ignored=risk,
            projected_impact=impact,
            action_steps=action_steps,
            scientific_reasoning=[
                f"Agronomic Category: {category.value}",
                f"Urgency: {directive.urgency.value}",
                f"Confidence Score: {directive.confidence_pct:.1f}%",
            ],
            supporting_evidence=directive.supporting_evidence,
            data_limitations=limitations_text,
            confidence_pct=directive.confidence_pct,
            needs_expert_review=directive.needs_expert_review,
            disclaimer=disclaimer_text,
            language=lang,
            model_version="rule_engine_deterministic_fallback_v1",
        )

