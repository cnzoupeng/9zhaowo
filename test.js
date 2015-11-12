var jieba = require('nodejieba');

//���طִʿ�
jieba.load();

var text = "本科毕业于厦门大学新闻传播学院新闻学专业，之后历任《第一财经周刊》记者、《创业家》杂志资深记者/TMT主笔。三年媒体生涯结束后，转战VC行业，任经纬创投分析师。 2013底离开机构自由闯荡，以个人天使的身份参与了一些早期项目；2014底，基于在早期投资当中许多需求得不到满足，创立了FellowPlus。 于经纬创投任职期间，完成国内最大医学美容社区O2O“更美”的天使轮融资；对社区电商、移动医疗、O2O及智能硬件等领域持续进行观察研究。 以个人天使方式进行早期投资市场参与期间，直接参与包括米牛网在内的多个互联网金融、B2B、O2O以及社区类早期项目，均在半年内拿到下一轮融资，并对自身及行业进行思考。 2014年底，与几位志同道合的小伙伴创办了专注于私募领域的互联网金融平台FellowPlus。 服务项目： 作为前媒体人、VC从业者，对于国内创投领域感悟多年。发现目前创投领域中，投资人工作效率不高、创业者寻求融资不专业，以及创业者投资人双方匹配渠道缺乏是十分普遍的问题。 这令许多有着优秀项目的创业者在融资道路上困难重重，也让许多希望投好项目的投资人不知道从哪里找到真正的好项目。在这样的环境下，我选择创业，做FellowPlus这样一个服务于投资人及创业者的互联网金融平台。 我曾是一名投资人，现在是一名创业者；在我心中，无论投资还是创业，都充满梦想与热情；期待与你坐下来聊聊那些创投中的事儿。";


function getSeg(str){
	var full = jieba.cut(str, 'FULL');
	var mix = jieba.cut(str, 'MIX');
	var out = [];
	var map = [];
	for(var i in full){
		if(!full[i] || full[i].length < 2 || map[full[i]]){
			continue;
		}
		map[full[i]] = true;
		out.push(full[i]);
	}
	for(var i in mix){
		if(!mix[i] || mix[i].length < 2 || map[mix[i]]){
			continue;
		}
		map[mix[i]] = true;
		out.push(mix[i]);
	}
	return out;
}

var arr = getSeg(text);

console.log(arr);
console.log(arr.length);
