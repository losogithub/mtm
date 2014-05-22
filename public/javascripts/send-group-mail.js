/**
 * Created by zan on 14-5-22.
 */

$(function(){
        $submitButton = $('#sendButton');
        $submitButton.on('click',function(){
                var subject = $('input[name="themeText"]').val();
                var text = $('textarea[name="text"]').val();
                var checkedBox = $('label[class="checkbox unchecked checked"]');
                var checkedBoxValue = 'checkbox1';
                if(checkedBox.length > 0){
                     checkedBoxValue = checkedBox[0].getAttribute('for');
                }
                var userListType = '1';
                if(checkedBoxValue == 'checkbox1'){
                    userListType = '1';
                }
                else if(checkedBoxValue == 'checkbox2'){
                    userListType = '2';
                }
                else {
                    userListType = '3';
                }
                console.log("userListType: "+ userListType);
                console.log("subject: " + subject);
                console.log("text: " + text);
            var txt;
            var r = confirm("请您再次检查将要发送的邮件");
            if (r == true) {
                console.log("ok");
            } else {
                console.log("check again");
                return;
            }
            //send to server
            $.post('/manage/groupemail', {
                userListType: userListType,
                subject: subject,
                text: text
            })
                .done(function (data) {
                    console.log(data);
                    if(data.success == "1"){
                        alert("success");
                    }
                })
                .fail(function () {
                });
        })
})