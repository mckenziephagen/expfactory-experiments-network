/* ************************************ */
/* Define helper functions */
/* ************************************ */
function addID() {
  jsPsych.data.addDataToLastTrial({exp_id: 'directed_forgetting_single_task_network__fmri'})
}

//added for motor counterbalancing
function getMotorPerm() {
	return motor_perm
}

//FUNCTIONS FOR GETTING FMRI SEQUENCES
function getdesignITIs(design_num) {
	x = fetch(pathDesignSource+'design_'+design_num+'/ITIs_clean.txt').then(res => res.text()).then(res => res).then(text => text.split(/\r?\n/));
	return x
} 
function getdesignEvents(design_num) {
	x = fetch(pathDesignSource+'design_'+design_num+'/events_clean.txt').then(res => res.text()).then(res => res).then(text => text.split(/\r?\n/));
	return x
}  


function assessPerformance() {
	/* Function to calculate the "credit_var", which is a boolean used to
	credit individual experiments in expfactory. */
	var experiment_data = jsPsych.data.getTrialsOfType('poldrack-single-stim')
	var missed_count = 0
	var trial_count = 0
	var rt_array = []
	var rt = 0
	var correct = 0
	
	//record choices participants made
	var choice_counts = {}
	choice_counts[-1] = 0
	choice_counts[89] = 0
	choice_counts[71] = 0
	for (var k = 0; k < choices.length; k++) {
		choice_counts[choices[k]] = 0
	}
	for (var i = 0; i < experiment_data.length; i++) {
		if (experiment_data[i].trial_id == 'test_trial') {
			trial_count += 1
			rt = experiment_data[i].rt
			key = experiment_data[i].key_press
			choice_counts[key] += 1
			if (rt == -1) {
				missed_count += 1
			} else {
				rt_array.push(rt)
			}
			
			if (key == experiment_data[i].correct_response){
				correct += 1
			}
		}
	}
	
	
	//calculate average rt
	var avg_rt = -1
	if (rt_array.length !== 0) {
		avg_rt = math.median(rt_array)
	} 
	//calculate whether response distribution is okay
	var responses_ok = true
	Object.keys(choice_counts).forEach(function(key, index) {
		if (choice_counts[key] > trial_count * 0.85) {
			responses_ok = false
		}
	})
	var missed_percent = missed_count/trial_count
	var accuracy = correct / trial_count
	credit_var = (missed_percent < 0.25 && avg_rt > 200 && responses_ok && accuracy > 0.60)
	jsPsych.data.addDataToLastTrial({final_credit_var: credit_var,
									 final_missed_percent: missed_percent,
									 final_avg_rt: avg_rt,
									 final_responses_ok: responses_ok,
									 final_accuracy: accuracy})
}

var getInstructFeedback = function() {
	return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
		'</p></div>'
}

var getFeedback = function() {
	return '<div class = bigbox><div class = picture_box><p class = block-text>' + feedback_text + '</p></div></div>'
}

var getTestFeedback = function() {
	return '<div class = bigbox><div class = picture_box><p class = block-text>' + test_feedback_text + '</p></div></div>'
}

var getCategorizeFeedback = function(){
	curr_trial = jsPsych.progress().current_trial_global - 2
	trial_id = jsPsych.data.getDataByTrialIndex(curr_trial).trial_id
	if (trial_id == 'refresh_trial'){
		if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == jsPsych.data.getDataByTrialIndex(curr_trial).correct_response){
			
			return '<div class = fb_box><div class = center-text><font size = 20>Correct!</font></div></div>' 
		} else if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press != jsPsych.data.getDataByTrialIndex(curr_trial).correct_response) && (jsPsych.data.getDataByTrialIndex(curr_trial).key_press != -1)){
			
			return '<div class = fb_box><div class = center-text><font size = 20>Incorrect</font></div></div>' 
	
		} else if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == -1){
			
			return '<div class = fb_box><div class = center-text><font size = 20>Respond Faster!</font></div></div>'
		}
	}
}

//this adds the probe shown, trial number, and whether it was a correct trial to the data
var appendProbeData = function(data) {
	var curr_trial = jsPsych.progress().current_trial_global
	var trialCue = cue
	var lastSet_top = letters.slice(0,numLetters/2)
	var lastSet_bottom = letters.slice(numLetters/2)
	var keypress = data.key_press
	var memorySet = ''
	var forgetSet = ''
	var correct = false
	if (trialCue == 'BOT') {
		memorySet = lastSet_top
		forgetSet = lastSet_bottom
	} else if (trialCue == 'TOP') {
		memorySet = lastSet_bottom
		forgetSet = lastSet_top
	}
	
	if (keypress == correct_response) {
		correct = true
	}
	
	jsPsych.data.addDataToLastTrial({
		correct: correct,
		probe_letter: probe,
		directed_forgetting_condition: directed_forgetting_condition,
		current_trial: current_trial,
		correct_response: correct_response,
		exp_stage: exp_stage,
		cue: cue,
		top_stim: lastSet_top,
		bottom_stim: lastSet_bottom,
		memory_set: memorySet,
		forget_set: forgetSet
	})
	
	
	if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == correct_response){
		jsPsych.data.addDataToLastTrial({
			correct_trial: 1,
		})

	} else if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press != correct_response){
		jsPsych.data.addDataToLastTrial({
			correct_trial: 0,
		})
	}
};

//this is an algorithm to choose the training set based on rules of the game (training sets are composed of any letter not presented in the last two training sets)
var getTrainingSet = function(used_letters, numLetters) {
	
	var trainingArray = jsPsych.randomization.repeat(stimArray, 1);
	var letters = trainingArray.filter(function(y) {
		
		return (jQuery.inArray(y, used_letters.slice(-numLetters*2)) == -1)
	}).slice(0,numLetters)
	
	return letters
};

//returns a cue pseudorandomly, either TOP or BOT
var getCue = function() {
	var temp = Math.floor(Math.random() * 2)
	cue = cueArray[temp]
	
	return cue
};

// Will pop out a probe type from the entire probeTypeArray and then choose a probe congruent with the probe type
var getProbe = function(letters,directed_forgetting_condition,cue) {
	var trainingArray = jsPsych.randomization.repeat(stimArray, 1);
	var lastSet_top = letters.slice(0,numLetters/2)
	var lastSet_bottom = letters.slice(numLetters/2)
	if (directed_forgetting_condition == 'pos') {
		if (cue == 'BOT') {
			probe = lastSet_top[Math.floor(Math.random() * numLetters/2)]
		} else if (cue == 'TOP') {
			probe = lastSet_bottom[Math.floor(Math.random() * numLetters/2)]
		}
	} else if (directed_forgetting_condition == 'neg') {
		if (cue == 'BOT') {
			probe = lastSet_bottom[Math.floor(Math.random() * numLetters/2)]
		} else if (cue == 'TOP') {
			probe = lastSet_top[Math.floor(Math.random() * numLetters/2)]
		}
	} else if (directed_forgetting_condition == 'con') {
		newArray = trainingArray.filter(function(y) {
			return (y != lastSet_top[0] && y != lastSet_top[1] &&
					y != lastSet_bottom[0] && y != lastSet_bottom[1])
		})
		probe = newArray.pop()
	}
		
	return probe
};

var getCueHTML = function(){
	return '<div class = bigbox><div class = centerbox><div class = cue-text>' + preFileType + cue + fileTypePNG + '</div></div></div>'
}

var getProbeHTML = function(){
	return '<div class = bigbox><div class = centerbox><div class = cue-text>' + preFileType + probe + fileTypePNG + '</div></div></div>'
}

var getLettersHTML = function(){
	stim = stims.pop()
	directed_forgetting_condition = stim.directed_forgetting_condition
	letters = stim.letters
	cue = stim.cue
	probe = stim.probe
	correct_response = stim.correct_response
	
	return task_boards[0]+ preFileType + letters[0] + fileTypePNG +
		   task_boards[1]+
		   task_boards[2]+ preFileType + letters[1] + fileTypePNG +
		   task_boards[3]+ preFileType + letters[2] + fileTypePNG +
		   task_boards[4]+
		   task_boards[5]+ preFileType + letters[3] + fileTypePNG +
		   task_boards[6]
}

var getCorrectResponse = function(probeType){
	if (probeType == 'pos') {
		return getPossibleResponses()[0][1]
	} else if (probeType == 'neg') {
		return getPossibleResponses()[1][1]
	} else if (probeType == 'con') {
		return getPossibleResponses()[1][1]
	}
}

var resetTrial = function() {
	current_trial = 0
	exp_stage = 'test'
}

var createTrialTypes = function (numTrialsPerBlock,numLetters){
	var probeTypeArray = jsPsych.randomization.repeat(probes, numTrialsPerBlock / probes.length)
	var used_letters = []
	var stims = []
	
	if (numTrialsPerBlock == refresh_length) {
	 for (var i = 0; i < numTrialsPerBlock; i++){
		var directed_forgetting_condition = probeTypeArray.pop()
		var letters = getTrainingSet(used_letters,numLetters)
		var cue = getCue()
		var probe = getProbe(letters,directed_forgetting_condition,cue)
		var correct_response = getCorrectResponse(directed_forgetting_condition)
		
		stim = {
			directed_forgetting_condition:directed_forgetting_condition,
			letters: letters,
			cue: cue,
			probe: probe,
			correct_response: correct_response
			}
		stims.unshift(stim)
		
		used_letters = used_letters.concat(letters)	
		}	
	} else { 
	curr_des_events = des_events.slice(0, numTrialsPerBlock)
	des_events = des_events.slice(numTrialsPerBlock,) //grab this block's event
	for (var i = 0; i < numTrialsPerBlock; i++){
		var directed_forgetting_condition = curr_des_events[i]
		var letters = getTrainingSet(used_letters,numLetters)
		var cue = getCue()
		var probe = getProbe(letters,directed_forgetting_condition,cue)
		var correct_response = getCorrectResponse(directed_forgetting_condition)
		
		stim = {
			directed_forgetting_condition:directed_forgetting_condition,
			letters: letters,
			cue: cue,
			probe: probe,
			correct_response: correct_response
			}
		stims.unshift(stim)
		
		used_letters = used_letters.concat(letters)	
			}	
		}			
	return stims	
}


//Functions added for in-person sessions
function genITIs() { 
	mean_iti = 0.5 //mean and standard deviation of 0.5 secs
	min_thresh = 0
	max_thresh = 4

	lambda = 1/mean_iti
	iti_array = []
	for (i=0; i < exp_len; i++) {
		curr_iti = - Math.log(Math.random()) / lambda;
		while (curr_iti > max_thresh || curr_iti < min_thresh) {
			curr_iti = - Math.log(Math.random()) / lambda;
		}
		iti_array.push(curr_iti*1000) //convert ITIs from seconds to milliseconds

	}
	return(iti_array)
}

function getITI_stim() { //added for fMRI compatibility
	var currITI = ITIs_stim.shift()
	if (currITI == 0.0) { //THIS IS JUST FOR CONVENIENCE BEFORE NEW DESIGNS ARE REGENERATED
		currITI = 0.1
	}
	return currITI
}

function getITI_resp() { //added for fMRI compatibility
	var currITI = ITIs_resp.shift()
	if (currITI == 0.0) { //THIS IS JUST FOR CONVENIENCE BEFORE NEW DESIGNS ARE REGENERATED
		currITI = 0.1
	}
	return currITI
}

function getChoices() {
	if (getMotorPerm()==0) {
		return [choices[1], choices[0]] 
	} else if (getMotorPerm()==1) {
		return choices
	}
}

function getPossibleResponses() {
	if (getMotorPerm()==0) {
		return possible_responses
	} else if (getMotorPerm()==1) {
		return [['middle finger', 71],['index finger', 89]]
	}
}

function getPromptTaskList() {
	return '<ul style="text-align:left;"><font color="white">'+
							'<li>Please respond if the probe (single letter) was in the memory set.'+
						   	'<li>In memory set: '+getPossibleResponses()[0][0]+'</li>'+
						   	'<li>Not in memory set: '+getPossibleResponses()[1][0]+'</li>'+
						   '</font></ul>'

}

function getTimeoutMessage() {
	return '<div class = upperbox><div class = center-text>Respond Faster!</div></div>' +
	getPromptTaskList()
  }

  function getRefreshFeedback() {
	if (exp_id='instructions') {
		return 	'<div class = centerbox>'+
		'<p class = block-text>In this experiment, on each trial you will be presented with '+
		''+numLetters+' letters. You must memorize all '+numLetters+' letters. </p>'+
	
		'<p class = block-text>After the presentation of '+numLetters+' letters, there will be a short delay. You will then be presented with a cue, '+
		'either <b>TOP</b> or <b>BOT</b>. This will instruct you to <b>forget</b> the '+
		''+numLetters/2+' letters located at either the top or bottom (respectively) of the screen.</p>' + 
		
		'<p class = block-text>So if you get the cue <b>TOP</b>, please <b>forget</b> the top '+numLetters/2+' letters.</p>'+
	
		'<p class = block-text>'+
			'The '+numLetters/2+' remaining letters that you must remember are called your <b>memory set</b>. You should remember '+
			'these '+numLetters/2+' letters while forgetting the other '+numLetters/2+'.</p>'+

		'<p class = block-text>You will then be presented with a single '+
		'letter. Respond with your '+ getPossibleResponses()[0][0] + ' if it is in the memory set, and your ' + getPossibleResponses()[1][0]+
		' if it was not in the memory set.</p>'+
			
		'<p class = block-text>We will start practice when you finish instructions. Please make sure you understand the instructions before moving on. During practice, you will receive a reminder of the rules.  <b>This reminder will be taken out for test</b>.</p>'+
		'<p class = block-text> Please press any button to let the experimenters know when you are ready to begin practice. </p>' + 
	'</div>'
	} else {
		return '<div class = bigbox><div class = picture_box><p class = instruct-text><font color="white">' + refresh_feedback_text + '</font></p></div></div>'
	}
}

function getRefreshTrialID() {
	return refresh_trial_id
}

function getRefreshFeedbackTiming() {
	return refresh_feedback_timing
}

function getRefreshResponseEnds() {
	return refresh_response_ends
}

/* ************************************ */
/* Define experimental variables */
/* ************************************ */
// generic task variables
var possible_responses = [['index finger', 89],['middle finger', 71]]
var credit_var = 0

// task specific variables
var choices = [89, 71]
var exp_stage = 'practice'
var refresh_length = 4 
var numTrialsPerBlock = 40
var numTestBlocks = 4
var accuracy_thresh = 0.75
var rt_thresh = 1000
var missed_thresh = 0.10
var exp_len = numTrialsPerBlock * numTestBlocks
var current_trial = 0
var stimArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
	'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];
var numLetters = 4
var cueArray = ['TOP', 'BOT']
var probe = ''
var cue = ''
//var preceeding1stims = []
var preceeding2stims = []
var probes = ['pos', 'pos', 'neg', 'con']
var stimFix = ['fixation']
var pathSource = '/static/experiments/directed_forgetting_single_task_network__fmri/images/'
var fileType = '.png'
var fileTypePNG = ".png'></img>"
var preFileType = "<img class = center src='/static/experiments/directed_forgetting_single_task_network__fmri/images/"

var task_boards = [['<div class = bigbox><div class = topLeft><div class = cue-text>'],['</div></div><div class = topMiddle><div class = cue-text>'],['</div></div><div class = topRight><div class = cue-text>'],['</div></div><div class = bottomLeft><div class = cue-text>'],['</div></div><div class = bottomMiddle><div class = cue-text>'],['</div></div><div class = bottomRight><div class = cue-text>'],['</div></div></div>']]			  
				  
//PRE LOAD IMAGES HERE
var pathSource = "/static/experiments/directed_forgetting_single_task_network__fmri/images/"
var pathDesignSource = "/static/experiments/directed_forgetting_single_task_network__fmri/designs/" //ADDED FOR fMRI SEQUENCES

var images = []

for(i = 0; i < stimArray.length; i++){
	images.push(pathSource + stimArray[i] + '.png')
}
images.push(pathSource + 'BOT.png')
images.push(pathSource + 'TOP.png')
jsPsych.pluginAPI.preloadImages(images);

ITIs_stim = []
ITIs_resp = [] 

var refresh_trial_id = "instructions"
var refresh_feedback_timing = -1
var refresh_response_ends = true

var motor_perm = 0


/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */
// Set up attention check node

var end_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "end",
	},
	timing_response: 10000,
	text: '<div class = centerbox><p class = center-block-text>Thanks for completing this task!',
	cont_key: [32],
	timing_post_trial: 0,
	on_finish: function(){
		assessPerformance()
    }
};

var feedback_instruct_text =
	'Welcome to the experiment.'

var refresh_feedback_block = {
	type: 'poldrack-single-stim',
	data: {
		trial_id: getRefreshTrialID
	},
	choices: [32],
	stimulus: getRefreshFeedback,
	timing_post_trial: 0,
	is_html: true,
	timing_response: getRefreshFeedbackTiming, //10 seconds for feedback
	timing_stim: getRefreshFeedbackTiming,
	response_ends_trial: getRefreshResponseEnds,
	on_finish: function() {
		refresh_trial_id = "practice-no-stop-feedback"
		refresh_feedback_timing = 10000
		refresh_response_ends = false
	} 
};

var design_setup_block = {
	type: 'survey-text',
	data: {
		trial_id: "design_setup"
	},
	questions: [
		[
			"<p class = center-block-text>Design permutation (0-4):</p>"
		]
	], on_finish: async function(data) {
		design_perm =parseInt(data.responses.slice(7, 10))
		des_ITIs = await getdesignITIs(design_perm)
		des_ITIs = des_ITIs.map(Number)
		ITIs_stim = des_ITIs.slice(0)
		ITIs_resp = des_ITIs.slice(0)
		des_events = await getdesignEvents(design_perm)
	}
}

var motor_setup_block = {
	type: 'survey-text',
	data: {
		trial_id: "motor_setup"
	},
	questions: [
		[
			"<p class = center-block-text>motor permutation (0-1):</p>"
		]
	], on_finish: function(data) {
		motor_perm=parseInt(data.responses.slice(7, 10))
		stims = createTrialTypes(refresh_length, numLetters)
		
	}
}

var start_fixation_block = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox><div class = fixation><span style="color:white">+</span></div></div>',
	is_html: true,
	choices: 'none',
	data: {
		trial_id: "fixation"
	},
	timing_post_trial: 0,
	timing_stim: getITI_stim, //500
	timing_response: getITI_resp, //500
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({
			exp_stage: exp_stage,
			current_trial: current_trial
		})
	}
}

var fixation_block = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox><div class = fixation><span style="color:white">+</span></div></div>',
	is_html: true,
	choices: 'none',
	data: {
		trial_id: "fixation"
	},
	timing_post_trial: 0,
	timing_stim: 2000, //2000
	timing_response: 2000, //2000,
	fixation_default: true,
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({
			exp_stage: exp_stage,
			current_trial: current_trial
		})
	}
}

var ITI_fixation_block = {
	type: 'poldrack-single-stim',
	is_html: true,
	choices: getChoices,
	data: {
		trial_id: "ITI_fixation"
	},
	timing_post_trial: 0,
	stimulus: '<div class = centerbox><div class = fixation><span style="color:white">+</span></div></div>',
	timing_stim: 1000, //1000
	timing_response: 1000, //1000
	fixation_default: true,
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({
			exp_stage: exp_stage,
			current_trial: current_trial
		})
		current_trial = current_trial + 1
	}
}

var training_block = {
	type: 'poldrack-single-stim',
	stimulus: getLettersHTML,
	is_html: true,
	data: {
		trial_id: "stim"
	},
	choices: 'none',
	timing_post_trial: 0,
	timing_stim: 2000, //2000
	timing_response: 2000 //2000
};



var cue_block = {
	type: 'poldrack-single-stim',
	stimulus: getCueHTML,
	is_html: true,
	data: {
		trial_id: "cue",
		exp_stage: "test"
	},
	choices: false,
	timing_post_trial: 0,
	timing_stim: 1000, //1000
	timing_response: 1000 //1000
};

var probe_block = {
	type: 'poldrack-single-stim',
	stimulus: getProbeHTML,
	is_html: true,
	data: {
		trial_id: "test_trial",
		exp_stage: "test"
	},
	choices: getChoices,
	timing_post_trial: 0,
	timing_stim: 1000, //1000
	timing_response: 1000, //1000
	response_ends_trial: false,
	on_finish: appendProbeData,
	fixation_default: true
	
};

var intro_test_block = {
	type: 'poldrack-text',
	timing_response: 180000,
	data: {
		trial_id: "intro_test",
		exp_stage: "test"
	},
	text: '<div class = centerbox><p class = block-text>We will now begin the experiment.  For these trials, you will no longer get feedback.</p><p class = block-text> Remember, the cue (TOP or BOT) tells you which letters to <i>forget</i>. At the end of the trial respond with the <i> M</i> key if the letter presented is in the memory set, and the <i> Z </i> key if it is not in the memory set.</p><p class = block-text> ',
	cont_key: [32],
	timing_post_trial: 1000,
	on_finish: resetTrial,
};


// var practice_probe_block = {
// 	type: 'poldrack-single-stim',
// 	stimulus: getProbeHTML,
// 	choices: choices,
// 	data: {trial_id: "practice_trial", 
// 		   exp_stage: "practice"
// 		   },
// 	timing_stim: 1000, //1000
// 	timing_response: 1000, //1000
// 	timing_post_trial: 0,
// 	is_html: true,
// 	prompt: prompt_text,
// 	on_finish: appendProbeData
// };


var refresh_probe_block = {
	type: 'poldrack-single-stim',
	stimulus: getProbeHTML,
	choices: getChoices,
	data: {trial_id: "refresh_trial", 
		   exp_stage: "refresh"
		   },
	timing_stim: 1000, //1000
	timing_response: 1000, //1000
	timing_post_trial: 0,
	is_html: true,
	prompt: getPromptTaskList,
	on_finish: appendProbeData
};

var feedback_text = 
	'Welcome to the experiment.'
var feedback_block = {
	type: 'poldrack-single-stim',
	data: {
		trial_id: "practice_feedback"
	},
	choices:'none',
	stimulus: getFeedback,
	timing_post_trial: 0,
	is_html: true,
	timing_response: 10000,
	response_ends_trial: true, 

};

var test_feedback_text = 
	'We will now start a test run.'
	
var test_feedback_block = {
	type: 'poldrack-single-stim',
	data: {
		trial_id: "test_feedback"
	},
	choices: 'none',
	stimulus: getTestFeedback,
	timing_post_trial: 0,
	is_html: true,
	timing_response: 10000,
	response_ends_trial: false, // HJ CHANGE 
};

// var practiceTrials = []
// practiceTrials.push(feedback_block)
// practiceTrials.push(instructions_block)
// for (i = 0; i < (practice_length); i++) {
// 	var practice_start_fixation_block = {
// 		type: 'poldrack-single-stim',
// 		stimulus: '<div class = centerbox><div class = fixation><span style="color:white">+</span></div></div>',
// 		is_html: true,
// 		choices: 'none',
// 		data: {
// 			trial_id: "practice_fixation"
// 		},
// 		timing_post_trial: 0,
// 		timing_stim: 500, //500
// 		timing_response: 500, //500
// 		prompt: prompt_text,
// 		on_finish: function() {
// 			jsPsych.data.addDataToLastTrial({
// 				exp_stage: exp_stage,
// 				current_trial: current_trial
// 			})
// 		}
// 	}

// 	var practice_fixation_block = {
// 		type: 'poldrack-single-stim',
// 		stimulus: '<div class = centerbox><div class = fixation><span style="color:white">+</span></div></div>',
// 		is_html: true,
// 		choices: 'none',
// 		data: {
// 			trial_id: "practice_fixation"
// 		},
// 		timing_post_trial: 0,
// 		timing_stim: 2000, //2000
// 		prompt: prompt_text,
// 		timing_response: 2000, //2000
// 		on_finish: function() {
// 			jsPsych.data.addDataToLastTrial({
// 				exp_stage: exp_stage,
// 				current_trial: current_trial
// 			})
// 		}
// 	}

// 	var practice_ITI_fixation_block = {
// 		type: 'poldrack-single-stim',
// 		is_html: true,
// 		choices: 'none',
// 		data: {
// 			trial_id: "practice_ITI_fixation"
// 		},
// 		timing_post_trial: 0,
// 		timing_stim: 1000, //1000
// 		prompt: prompt_text,
// 		timing_response: 1000, //1000
// 		on_finish: function() {
// 			jsPsych.data.addDataToLastTrial({
// 				exp_stage: exp_stage,
// 				current_trial: current_trial
// 			})
// 			current_trial = current_trial + 1
// 		}
// 	}

// 	var practice_training_block = {
// 		type: 'poldrack-single-stim',
// 		stimulus: getLettersHTML,
// 		is_html: true,
// 		data: {
// 			trial_id: "practice_stim"
// 		},
// 		choices: 'none',
// 		prompt: prompt_text,
// 		timing_post_trial: 0,
// 		timing_stim: 2000, //2000
// 		timing_response: 2000 //2000
// 	};



// 	var practice_cue_block = {
// 		type: 'poldrack-single-stim',
// 		stimulus: getCueHTML,
// 		is_html: true,
// 		data: {
// 			trial_id: "practice_cue",
// 		},
// 		choices: 'none',
// 		prompt: prompt_text,
// 		timing_post_trial: 0,
// 		timing_stim: 1000, //1000
// 		timing_response: 1000 //1000
// 	};
	
// 	var categorize_block = {
// 		type: 'poldrack-single-stim',
// 		data: {
// 			trial_id: "practice-stop-feedback"
// 		},
// 		choices: 'none',
// 		stimulus: getCategorizeFeedback,
// 		timing_post_trial: 0,
// 		is_html: true,
// 		timing_stim: 500, //500
// 		timing_response: 500, //500
// 		response_ends_trial: false, 

// 	};
	
// 	practiceTrials.push(practice_start_fixation_block);
// 	practiceTrials.push(practice_training_block);
// 	practiceTrials.push(practice_cue_block);
// 	practiceTrials.push(practice_fixation_block);
// 	practiceTrials.push(practice_probe_block);
// 	practiceTrials.push(practice_ITI_fixation_block);
// 	practiceTrials.push(categorize_block);
// }


// var practiceCount = 0
// var practiceNode = {
// 	timeline: practiceTrials,
// 	loop_function: function(data){
// 		practiceCount += 1
// 		stims = createTrialTypes(practice_length,numLetters)
	
// 		var sum_rt = 0
// 		var sum_responses = 0
// 		var correct = 0
// 		var total_trials = 0
	
// 		for (var i = 0; i < data.length; i++){
// 			if (data[i].trial_id == 'practice_trial'){
// 				total_trials+=1
// 				if (data[i].rt != -1){
// 					sum_rt += data[i].rt
// 					sum_responses += 1
// 					if (data[i].key_press == data[i].correct_response){
// 						correct += 1
		
// 					}
// 				}
		
// 			}
	
// 		}
	
// 		var accuracy = correct / total_trials
// 		var missed_responses = (total_trials - sum_responses) / total_trials
// 		var ave_rt = sum_rt / sum_responses
	
// 		feedback_text = "<br>Please take this time to read your feedback and to take a short break! Press enter to continue"

// 		if (accuracy > accuracy_thresh){
// 			feedback_text +=
// 					'</p><p class = block-text>Done with this practice. Press Enter to continue.' 
// 			stims = createTrialTypes(numTrialsPerBlock,numLetters)
// 			return false
	
// 		} else if (accuracy < accuracy_thresh){
// 			feedback_text +=
// 					'</p><p class = block-text>We are going to try practice again to see if you can achieve higher accuracy.  Remember: <br>' + prompt_text_list
					
// 			if (missed_responses > missed_thresh){
// 				feedback_text +=
// 						'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
// 			}

// 	      	if (ave_rt > rt_thresh){
// 	        	feedback_text += 
// 	            	'</p><p class = block-text>You have been responding too slowly.'
// 	      	}

		
// 			if (practiceCount == practice_thresh){
// 				feedback_text +=
// 					'</p><p class = block-text>Done with this practice.' 
// 					stims = createTrialTypes(numTrialsPerBlock,numLetters)
// 					return false
// 			}
			
// 			feedback_text +=
// 				'</p><p class = block-text>Redoing this practice. Press Enter to continue.' 
			
// 			return true
		
// 		}
	
// 	}
	
// }

var refreshTrials = []
refreshTrials.push(refresh_feedback_block)
for (i = 0; i < (refresh_length); i++) {
	var refresh_start_fixation_block = {
		type: 'poldrack-single-stim',
		stimulus: '<div class = centerbox><div class = fixation><span style="color:white">+</span></div></div>',
		is_html: true,
		choices: 'none',
		data: {
			trial_id: "refresh_fixation"
		},
		timing_post_trial: 0,
		timing_stim: 500, //500
		timing_response: 500, //500
		prompt: getPromptTaskList,
		on_finish: function() {
			jsPsych.data.addDataToLastTrial({
				exp_stage: exp_stage,
				current_trial: current_trial
			})
		}
	}

	var refresh_fixation_block = {
		type: 'poldrack-single-stim',
		stimulus: '<div class = centerbox><div class = fixation><span style="color:white">+</span></div></div>',
		is_html: true,
		choices: 'none',
		data: {
			trial_id: "refresh_fixation"
		},
		timing_post_trial: 0,
		timing_stim: 2000, //2000
		prompt: getPromptTaskList,
		timing_response: 2000, //2000
		on_finish: function() {
			jsPsych.data.addDataToLastTrial({
				exp_stage: exp_stage,
				current_trial: current_trial
			})
		}
	}

	var refresh_ITI_fixation_block = {
		type: 'poldrack-single-stim',
		is_html: true,
		choices: 'none',
		data: {
			trial_id: "refresh_ITI_fixation"
		},
		timing_post_trial: 0,
		timing_stim: 1000, //1000
		prompt: getPromptTaskList,
		timing_response: 1000, //1000
		on_finish: function() {
			jsPsych.data.addDataToLastTrial({
				exp_stage: exp_stage,
				current_trial: current_trial
			})
			current_trial = current_trial + 1
		}
	}

	var refresh_training_block = {
		type: 'poldrack-single-stim',
		stimulus: getLettersHTML,
		is_html: true,
		data: {
			trial_id: "refresh_stim"
		},
		choices: 'none',
		prompt: getPromptTaskList,
		timing_post_trial: 0,
		timing_stim: 2000, //2000
		timing_response: 2000 //2000
	};

	var refresh_cue_block = {
		type: 'poldrack-single-stim',
		stimulus: getCueHTML,
		is_html: true,
		data: {
			trial_id: "refresh_cue",
		},
		choices: 'none',
		prompt: getPromptTaskList,
		timing_post_trial: 0,
		timing_stim: 1000, //1000
		timing_response: 1000 //1000
	};
	
	var categorize_block = {
		type: 'poldrack-single-stim',
		data: {
			trial_id: "refresh-stop-feedback"
		},
		choices: 'none',
		stimulus: getCategorizeFeedback,
		timing_post_trial: 0,
		is_html: true,
		timing_stim: 500, //500
		timing_response: 500, //500
		prompt: getPromptTaskList,
		response_ends_trial: false, 

	};
	
	refreshTrials.push(refresh_start_fixation_block);
	refreshTrials.push(refresh_training_block);
	refreshTrials.push(refresh_cue_block);
	refreshTrials.push(refresh_fixation_block);
	refreshTrials.push(refresh_probe_block);
	refreshTrials.push(refresh_ITI_fixation_block);
	refreshTrials.push(categorize_block);
}

var refreshCount = 0
var refreshNode = {
	timeline: refreshTrials,
	loop_function: function(data){
		refreshCount += 1
		stims = createTrialTypes(numTrialsPerBlock,numLetters)
	
		var sum_rt = 0
		var sum_responses = 0
		var correct = 0
		var total_trials = 0
	
		for (var i = 0; i < data.length; i++){
			if (data[i].trial_id == 'refresh_trial'){
				total_trials+=1
				if (data[i].rt != -1){
					sum_rt += data[i].rt
					sum_responses += 1
					if (data[i].key_press == data[i].correct_response){
						correct += 1
		
					}
				}
		
			}
	
		}
	
		var accuracy = correct / total_trials
		var missed_responses = (total_trials - sum_responses) / total_trials
		var ave_rt = sum_rt / sum_responses
	
		feedback_text = "<br>Please take this time to read your feedback and to take a short break! "

		if (accuracy > accuracy_thresh){
			feedback_text +=
					'</p><p class = block-text>Done with this practice.' 
	
		} else if (accuracy < accuracy_thresh){
			feedback_text +=
					'</p><p class = block-text> Remember: <br>' + getPromptTaskList()
					
			if (missed_responses > missed_thresh){
				feedback_text +=
						'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
			}

	      	if (ave_rt > rt_thresh){
	        	feedback_text += 
	            	'</p><p class = block-text>You have been responding too slowly.'
	      	}

		
			// if (refreshCount == refresh_thresh){
			// 	feedback_text +=
			// 		'</p><p class = block-text>Done with this practice.' 
			// 		stims = createTrialTypes(numTrialsPerBlock,numLetters)
			// 		return false
			// }
			
			
			return false
		
		}
	
	}
	
}

var testTrials0 = []
for (i = 0; i < numTrialsPerBlock; i++) { //numTrialsPerBlock
	testTrials0.push(start_fixation_block);
	testTrials0.push(training_block);
	testTrials0.push(cue_block);
	testTrials0.push(fixation_block);
	testTrials0.push(probe_block);
	testTrials0.push(ITI_fixation_block);
}

var testCount = 0
var testNode0 = {
	timeline: testTrials0,
	loop_function: function(data) {
		stims = createTrialTypes(numTrialsPerBlock,numLetters)
		testCount += 1
		current_trial = 0 
		
		//below are counters to see if the subject is treating this task as a directed remembering as opposed to a directed forgetting task
		var respond_remember_total = 0
		var neg_respond_remember = 0
		var pos_respond_remember = 0
	
		for (var i = 0; i < data.length; i++) {
			if (data[i].trial_id == 'test_trial') {
				if(data[i].probe_type == 'neg'){
					respond_remember_total += 1
					if(data[i].key_press == getChoices()[1]){
						neg_respond_remember += 1
					}
				}else if (data[i].probe_type == 'pos'){
					respond_remember_total += 1
					if(data[i].key_press == getChoices[0]){
						pos_respond_remember += 1
					}
				}
			
			}
		}
	
	
		var directed_remembering_total = neg_respond_remember + pos_respond_remember
		var directed_remembering_percent = directed_remembering_total / respond_remember_total 

		console.log(directed_remembering_percent)
		if (directed_remembering_percent >= 0.75){
			test_feedback_text = 'According to the pattern of your responses, we believe that you are treating this task as a directed remembering task.  Please remember that <i>this is a directed forgetting task</i>.</p>'+
								 '<p class = block-text>When you are presented with the cue TOP, you should <i> forget the top letters</i> and <i>remember the bottom letters.</i></p>'+
								 '<p class = block-text>When you are presented with the cue BOT, you should <i> forget the bottom letters</i> and <i>remember the top letters.</i></p>'+
								 '<p class = block-text>Press the <i>left</i> arrow key if the probe letter <i> is in the memory set</i>, and the <i>right</i> if it is <i>not in the memory set</i>.</p>'+
								 '<p class = block-text>Press enter to continue.'	
		} 
			var sum_rt = 0
			var sum_responses = 0
			var correct = 0
			var total_trials = 0
	
			for (i = 0; i < data.length; i++){
				if (data[i].trial_id == "test_trial"){
					total_trials+=1
					if (data[i].rt != -1){
						sum_rt += data[i].rt
						sum_responses += 1
						if (data[i].key_press == data[i].correct_response){
							correct += 1
		
						}
					}
		
				}
	
			}
		
			var accuracy = correct / total_trials
			var missed_responses = (total_trials - sum_responses) / total_trials
			var ave_rt = sum_rt / sum_responses
	
			test_feedback_text = "<br>Please take this time to read your feedback and to take a short break! Press enter to continue"
			test_feedback_text += "</p><p class = block-text>You have completed: "+testCount+" out of "+numTestBlocks+" blocks of trials."
			
		
			if (accuracy < accuracy_thresh){
				test_feedback_text +=
						'</p><p class = block-text>Your accuracy is too low.  Remember: <br>' + getPromptTaskList()
			}
			if (missed_responses > missed_thresh){
				test_feedback_text +=
						'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
			}

	      	if (ave_rt > rt_thresh){
	        	feedback_text += 
	            	'</p><p class = block-text>You have been responding too slowly.'
			  }
			return false  			
		
	}

}

var testTrials = []
testTrials.push(test_feedback_block)
for (i = 0; i < numTrialsPerBlock; i++) { //numTrialsPerBlock
	testTrials.push(start_fixation_block);
	testTrials.push(training_block);
	testTrials.push(cue_block);
	testTrials.push(fixation_block);
	testTrials.push(probe_block);
	testTrials.push(ITI_fixation_block);
}

var testNode = {
	timeline: testTrials,
	loop_function: function(data) {
		stims = createTrialTypes(numTrialsPerBlock,numLetters)
		testCount += 1

		//below are counters to see if the subject is treating this task as a directed remembering as opposed to a directed forgetting task
		var respond_remember_total = 0
		var neg_respond_remember = 0
		var pos_respond_remember = 0
	
		for (var i = 0; i < data.length; i++) {
			if (data[i].trial_id == 'test_trial') {
				if(data[i].probe_type == 'neg'){
					respond_remember_total += 1
					if(data[i].key_press == getChoices()[1]){
						neg_respond_remember += 1
					}
				}else if (data[i].probe_type == 'pos'){
					respond_remember_total += 1
					if(data[i].key_press == getChoices()[0]){
						pos_respond_remember += 1
					}
				}
			
			}
		}
	
	
		var directed_remembering_total = neg_respond_remember + pos_respond_remember
		var directed_remembering_percent = directed_remembering_total / respond_remember_total 

		if (directed_remembering_percent >= 0.75){
			test_feedback_text = 'According to the pattern of your responses, we believe that you are treating this task as a directed remembering task.  Please remember that <i>this is a directed forgetting task</i>.</p>'+
								 '<p class = block-text>When you are presented with the cue TOP, you should <i> forget the top letters</i> and <i>remember the bottom letters.</i></p>'+
								 '<p class = block-text>When you are presented with the cue BOT, you should <i> forget the bottom letters</i> and <i>remember the top letters.</i></p>'+
								 '<p class = block-text>Press the <i>left</i> arrow key if the probe letter <i> is in the memory set</i>, and the <i>right</i> if it is <i>not in the memory set</i>.</p>'+
								 '<p class = block-text>Press enter to continue.'	
		} 
			var sum_rt = 0
			var sum_responses = 0
			var correct = 0
			var total_trials = 0
	
			for (i = 0; i < data.length; i++){
				if (data[i].trial_id == "test_trial"){
					total_trials+=1
					if (data[i].rt != -1){
						sum_rt += data[i].rt
						sum_responses += 1
						if (data[i].key_press == data[i].correct_response){
							correct += 1
		
						}
					}
		
				}
	
			}
		
			var accuracy = correct / total_trials
			var missed_responses = (total_trials - sum_responses) / total_trials
			var ave_rt = sum_rt / sum_responses
	
			test_feedback_text = "<br>Please take this time to read your feedback and to take a short break! Press enter to continue"
			test_feedback_text += "</p><p class = block-text>You have completed: "+testCount+" out of "+numTestBlocks+" blocks of trials."
			
		
			if (accuracy < accuracy_thresh){
				test_feedback_text +=
						'</p><p class = block-text>Your accuracy is too low.  Remember: <br>' + getPromptTaskList()
			}
			if (missed_responses > missed_thresh){
				test_feedback_text +=
						'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
			}

	      	if (ave_rt > rt_thresh){
	        	feedback_text += 
	            	'</p><p class = block-text>You have been responding too slowly.'
	      	}
			  

			if (testCount == numTestBlocks){
				test_feedback_text +=
						'</p><p class = block-text>Done with this test.'
				return false
		}
		else {
			return true
		}
	}

}
/* create experiment definition array */
var directed_forgetting_single_task_network__fmri_experiment = [];

directed_forgetting_single_task_network__fmri_experiment.push(design_setup_block)
directed_forgetting_single_task_network__fmri_experiment.push(motor_setup_block)

//directed_forgetting_single_task_network__fmri_experiment.push(practiceNode)
//directed_forgetting_single_task_network__fmri_experiment.push(feedback_block)
test_keys(directed_forgetting_single_task_network__fmri_experiment, [getChoices()[1], getChoices()[0]])

directed_forgetting_single_task_network__fmri_experiment.push(refreshNode)
directed_forgetting_single_task_network__fmri_experiment.push(feedback_block)

cni_bore_setup(directed_forgetting_single_task_network__fmri_experiment)

//directed_forgetting_single_task_network__fmri_experiment.push(intro_test_block)

directed_forgetting_single_task_network__fmri_experiment.push(testNode0)

directed_forgetting_single_task_network__fmri_experiment.push(testNode)
directed_forgetting_single_task_network__fmri_experiment.push(test_feedback_block)

directed_forgetting_single_task_network__fmri_experiment.push(end_block);