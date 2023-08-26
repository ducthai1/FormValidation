// Đối tượng validator
function Validator (options){

    function getParent(element, selector) {
        while(element.parentElement) {
            if (element.parentElement.matches(selector)){
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {};

    // Hàm thực hiện 
    function validate(inputElement, rule){
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        var errorMessage;

        // Lấy ra các rule của selector
        var rules = selectorRules[rule.selector];

        // Lặp qua từng rule và kiểm tra
        // Nếu có lỗi thì dừng việc kiểm tra -> Cứ có lỗi nào trước là break luôn -> Message lỗi đầu tiên nhận đc
        for(var i = 0; i < rules.length; ++i) {
            errorMessage = rules[i](inputElement.value);
            if(errorMessage) break
        }

        if(errorMessage) {
            errorElement.innerText = errorMessage
            getParent(inputElement, options.formGroupSelector).classList.add('invalid')
        }
        else {
            errorElement.innerText = ''
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
        }
        return !errorMessage; //convert thành boolean có lỗi là true, không có lỗi là false
    }

    // Lấy element của form cần validate
    var formElement = document.querySelector (options.form);
    if(formElement){
        // Khi submit form
        formElement.onsubmit = function(e){
            // Loại bỏ hành vi submit mặc định
            e.preventDefault();

            var isFormValid = true;

            // Lặp qua tất cả các rule và check validate tất cả rule luôn
            options.rules.forEach((rule)=>{
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule); // true
                if(!isValid){ // Nếu có 1 rule không hợp lệ thì form sẽ ko hợp lệ
                    isFormValid = false
                }
            });
            if(isFormValid) {
                // Trường hợp submit với JS
                if (typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]:not([disable])') //Select tất cả field có atb là name, không có atb [disable]
    
                    var formValue = Array.from(enableInputs).reduce(function (values, input) {
                        [values[input.name] = input.value]
                        return values;
                    }, {}); // Chuyển Nodelist thành arr để dùng được reduce
                    options.onSubmit(formValue)
                }
                // Trường hợp submit với hành vi mặc định
                else {
                    formElement.submit();
                }
            }
        }

        // Lặp qua mỗi rule và xử lí (lắng nghe blur, input, ...)
        options.rules.forEach((rule)=>{

            // Lưu lại các rule cho mỗi input
            // selectorRules[rule.selector] = rule.test; //Key = value
            if(Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test) // Đã là mảng rồi thì cứ thêm vào các rule
            } else {
                selectorRules[rule.selector] = [rule.test]; // Nếu ko phải là mảng thì gán phần tử đầu của mảng là cái rule đầu
            }

            var inputElement = formElement.querySelector(rule.selector); // Tìm input ở trong form đã chỉ định
            
            if(inputElement) {
                // Xử lí trường hợp blur khỏi input
                inputElement.onblur = function() {
                    // value: inputElement.value
                    // test: func: rule.test
                    validate(inputElement, rule)
                }
                
                // Xử lí trường hợp người dùng đang nhập
                inputElement.oninput = function(){ // Bắt sự kiện khi gõ
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                    errorElement.innerText = ''
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
                }
            }
        });
    }
}

// Định nghĩa rules
// Nguyên tắc chung của rules:
// 1. Khi có lỗi => in ra message lỗi
// 2. Khi hợp lệ => Không trả về gì cả (Tức là trả về undefined)
Validator.isRequired = function (selector, message){

    return {
        selector: selector,
        test: function(value) {
            return value.trim() ? undefined : message || 'Vui lòng nhập trường này'
        }
    };
}

Validator.isEmail = function (selector, message){
    return {
        selector: selector,
        test: function(value){
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Trường này phải là email!'
        }
    };
}

Validator.minLength = function (selector, min, message){
    return {
        selector: selector,
        test: function(value){
            return value.length >= min ? undefined : message || `Vui lòng nhập ít nhất ${min} ký tự!`
        }
    };
}

Validator.isConfirmed = function(selector, getConfirmValue, message){
    return {
        selector: selector,
        test: function(value){
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác'
        }
    }
}