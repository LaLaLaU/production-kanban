// 浏览器兼容性检测脚本
(function() {
  'use strict';
  
  // 检测必需的功能
  var checks = {
    localStorage: function() {
      try {
        var test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch(e) {
        return false;
      }
    },
    
    webAssembly: function() {
      return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
    },
    
    fileAPI: function() {
      return window.File && window.FileReader && window.FileList && window.Blob;
    },
    
    es6Features: function() {
      try {
        // 检测箭头函数
        eval('() => {}');
        // 检测let/const
        eval('let x = 1; const y = 2;');
        // 检测模板字符串
        eval('`template`');
        return true;
      } catch(e) {
        return false;
      }
    },
    
    fetch: function() {
      return typeof fetch === 'function';
    }
  };
  
  // 浏览器信息检测
  function getBrowserInfo() {
    var ua = navigator.userAgent;
    var browser = {
      name: 'Unknown',
      version: 'Unknown',
      isSupported: false
    };
    
    // Chrome
    var chromeMatch = ua.match(/Chrome\/(\d+)/);
    if (chromeMatch) {
      browser.name = 'Chrome';
      browser.version = parseInt(chromeMatch[1]);
      browser.isSupported = browser.version >= 49;
      return browser;
    }
    
    // Firefox
    var firefoxMatch = ua.match(/Firefox\/(\d+)/);
    if (firefoxMatch) {
      browser.name = 'Firefox';
      browser.version = parseInt(firefoxMatch[1]);
      browser.isSupported = browser.version >= 45;
      return browser;
    }
    
    // Edge
    var edgeMatch = ua.match(/Edge\/(\d+)/) || ua.match(/Edg\/(\d+)/);
    if (edgeMatch) {
      browser.name = 'Edge';
      browser.version = parseInt(edgeMatch[1]);
      browser.isSupported = browser.version >= 79;
      return browser;
    }
    
    // Safari
    var safariMatch = ua.match(/Version\/(\d+).*Safari/);
    if (safariMatch) {
      browser.name = 'Safari';
      browser.version = parseInt(safariMatch[1]);
      browser.isSupported = browser.version >= 10;
      return browser;
    }
    
    // IE (不支持)
    if (ua.indexOf('MSIE') !== -1 || ua.indexOf('Trident') !== -1) {
      browser.name = 'Internet Explorer';
      browser.isSupported = false;
      return browser;
    }
    
    return browser;
  }
  
  // 执行检测
  function runCompatibilityCheck() {
    var results = {};
    var allPassed = true;
    
    // 执行功能检测
    for (var check in checks) {
      results[check] = checks[check]();
      if (!results[check]) {
        allPassed = false;
      }
    }
    
    // 浏览器检测
    var browserInfo = getBrowserInfo();
    results.browser = browserInfo;
    
    if (!browserInfo.isSupported) {
      allPassed = false;
    }
    
    return {
      passed: allPassed,
      results: results,
      browser: browserInfo
    };
  }
  
  // 显示兼容性警告
  function showCompatibilityWarning(checkResult) {
    var warningDiv = document.createElement('div');
    warningDiv.id = 'compatibility-warning';
    warningDiv.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100%',
      'height: 100%',
      'background: rgba(0,0,0,0.8)',
      'color: white',
      'font-family: Arial, sans-serif',
      'font-size: 14px',
      'z-index: 10000',
      'display: flex',
      'align-items: center',
      'justify-content: center'
    ].join(';');
    
    var contentDiv = document.createElement('div');
    contentDiv.style.cssText = [
      'background: #fff',
      'color: #333',
      'padding: 30px',
      'border-radius: 8px',
      'max-width: 500px',
      'text-align: center',
      'box-shadow: 0 4px 20px rgba(0,0,0,0.3)'
    ].join(';');
    
    var html = [
      '<h2 style="color: #e74c3c; margin-top: 0;">⚠️ 浏览器兼容性警告</h2>',
      '<p>检测到您的浏览器可能无法正常运行此应用。</p>',
      '<div style="text-align: left; margin: 20px 0;">',
      '<p><strong>当前浏览器：</strong>' + checkResult.browser.name + ' ' + checkResult.browser.version + '</p>',
      '<p><strong>功能检测结果：</strong></p>',
      '<ul style="margin: 10px 0;">'
    ];
    
    // 添加检测结果
    var featureNames = {
      localStorage: '本地存储',
      webAssembly: 'WebAssembly',
      fileAPI: '文件API',
      es6Features: 'ES6语法',
      fetch: 'Fetch API'
    };
    
    for (var feature in checkResult.results) {
      if (feature !== 'browser') {
        var status = checkResult.results[feature] ? '✅' : '❌';
        var name = featureNames[feature] || feature;
        html.push('<li>' + status + ' ' + name + '</li>');
      }
    }
    
    html = html.concat([
      '</ul>',
      '</div>',
      '<div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">',
      '<p><strong>推荐使用以下浏览器：</strong></p>',
      '<ul style="text-align: left; margin: 10px 0;">',
      '<li>Chrome 49+ (推荐)</li>',
      '<li>Firefox 45+</li>',
      '<li>Edge 79+</li>',
      '<li>Safari 10+</li>',
      '</ul>',
      '</div>',
      '<div style="margin-top: 20px;">',
      '<button onclick="document.getElementById(\'compatibility-warning\').style.display=\'none\'" ',
      'style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">',
      '仍要继续</button>',
      '<button onclick="window.close()" ',
      'style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">',
      '关闭页面</button>',
      '</div>'
    ]);
    
    contentDiv.innerHTML = html.join('');
    warningDiv.appendChild(contentDiv);
    document.body.appendChild(warningDiv);
  }
  
  // 显示加载提示
  function showLoadingTip() {
    var tipDiv = document.createElement('div');
    tipDiv.id = 'loading-tip';
    tipDiv.style.cssText = [
      'position: fixed',
      'top: 20px',
      'right: 20px',
      'background: #2ecc71',
      'color: white',
      'padding: 10px 15px',
      'border-radius: 4px',
      'font-family: Arial, sans-serif',
      'font-size: 12px',
      'z-index: 9999',
      'box-shadow: 0 2px 10px rgba(0,0,0,0.2)'
    ].join(';');
    
    tipDiv.innerHTML = '✅ 浏览器兼容性检测通过';
    document.body.appendChild(tipDiv);
    
    // 3秒后自动隐藏
    setTimeout(function() {
      if (tipDiv.parentNode) {
        tipDiv.parentNode.removeChild(tipDiv);
      }
    }, 3000);
  }
  
  // 在DOM加载完成后执行检测
  function init() {
    var checkResult = runCompatibilityCheck();
    
    console.log('浏览器兼容性检测结果:', checkResult);
    
    if (!checkResult.passed) {
      showCompatibilityWarning(checkResult);
    } else {
      showLoadingTip();
    }
    
    // 将检测结果存储到全局变量，供应用使用
    window.browserCompatibility = checkResult;
  }
  
  // 等待DOM加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();