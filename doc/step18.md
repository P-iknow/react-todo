

## 요구 사항

- [x] 새로운 할일을 등록하고, 새로운 할일이 리스트에 추가된다.
- [x] **'X'** 버튼을 클릭하면 해당영역의 할일이 삭제된다.
- [x] 할일내용을 클릭하면 **취소선이 표시**되면서 **완료된 상태**로 변경된다.
- [x] todolist 항목이 **접기 / 펼치기**로 노출이 됐다 안됐다 한다.
- [x] 초기데이터는 fetch로 가져오는 동안 '**loading중…**' 이라는 메시지를 노출한다.
- Hooks API로 모두 변경한다.
  - [x] 모든 Classes 컴포넌트를 Hooks를 사용해서 함수형 컴포넌트로 변경한다.
  - [x] **useFetch** 라는 **custom hook** 을 만들어서, 다른 컴포넌트에서도 데이터 통신작업에서 **재사용**할 수 있도록 해보자.
- Express를 사용해서 API 서버환경을 만든다.
  - [x] API서버에서는 todolist 초기 데이터를 JSON으로 반환한다.
  - [x] 클라이언트에서는 이 데이터를 기본으로 렌더링한다.
- 추가UI구성
  - [x] 우측상단에 **할일과 완료된일의 갯수**를 보여주는 UI를 추가로 만든다. (우측상단 동그라미 영역)
  - [x] 이 부분을 개발할때 **useContext API, useReducer**를 사용해서 state를 관리 한다.

## 실행 계획 

### Form 기능 구현 하기

- [x] 텍스트 내용 바뀌면 state 업데이트
- [x] 버튼이 클릭되면 새로운 todo 생성 후 todos 업데이트
- [x] 인풋에서 Enter 누르면 버튼을 클릭한것과 동일한 작업진행하기

### todo item 컴포넌트 기능

- [x] onToggle 함수 구현 : todoitem 영역 클릭시 done, todo 상태 변경 토글
- [x] chekbox design 적용 
- [x] remove 함수 구현: 클릭시 todoitem 삭제 

### Fold 구현 

- [x] fold 버튼이 들어갈 subtitle 컴포넌트 생성 
- [x] fold button design(rotate)  
- [x] fold 버튼 눌렀을 시 todowrap 태그의 height 조정으로 기능 구현
- [ ] Acordian UI 처럼 fold 버튼 클릭시 에니메이션을 구현(ref 적용 필요)
  - 복잡도가 높아 나중으로 연기 

### 초기데이터는 fetch로 가져오는 동안 '**loading중…**'  구현

- [x] Loader 컴포넌트 생성 및 디자인
- [x] componentDidmount 내부의 상태변경 로직 추가 및 TodoListItem 내부에서 loding 상태에 따른 분기처리 
- [x] sleep 함수 만들어서(2초간 sleep) 초기 렌더링 2초 지연해서 loading 구현 살피기
- [ ] suspense Reactjs.org

#### 참고 

- https://codesandbox.io/s/o5yw60jwlq?from-embed

### State Refactoring

- [x] state 깔끔하게 만들기 
- [x] reducer 적용하기

todos 와 loading 두 개의 상태 관리가 필요할까? 더 깔끔하게 적용하는 법은 없을까?

```js
// todos 와 loading 을 같이쓰고 있다
const [todos, setTodos] = useState([]);
const [folded, setFolded] = useState(false);
const [loading, setLoading] = useState(true);
const [value, setValue] = useState('');

// useEffect에서는 아래와 같이 두개의 상태변경이 있다.
useEffect(() => {
  (async () => {
    const errorMsg = ERROR_MSG.FETCh;
    await sleep();
    try {
      const response = await fetch(FetchUrl);
      if (!response.ok) throw new Error(errorMsg);

      const data = await response.json();

      if (!data.statusCode === 200) throw new Error(errorMsg);
      // 두개의 상태변경
      setTodos(data.body);
      setLoading(false);
    } catch (err) {
      console.warn(err);
    }
  })();
}, []);
```

하나의 상태로 만든다면?

```js
const [todos, setTodos] = useState({
  loading: true,
  data: null,
  error: null
})

useEffect(() => {
  (async () => {
    const errorMsg = ERROR_MSG.FETCh;
    await sleep();
    try {
      const response = await fetch(FetchUrl);
      if (!response.ok) throw new Error(errorMsg);

      const data = await response.json();

      if (!data.statusCode === 200) throw new Error(errorMsg);
      // 두개의 상태변경
      setTodos({
        loading: false,
        data: data.body,
        error: null
      });
    } catch (err) {
      console.warn(err);
      setTodos({
        loading: false,
        data: null,
        error: err
      });
    }
  })();
}, []);
```

이렇게 고민하다가 위 처럼 코드를 바꿧는데, `onCreate` , `onRemove` 함수에서 `todos` 를 변경하는 로직이 복잡해서 위 설계에 문제가 있다는 점을 발견

 todos 데이터의 상태와, loading 상태를 같이두는 것은 로딩한 데이터가 더 이상 수정이 없다는 가정하에만 괜찮은 로직인 것 같다 라고 판단함 

커스텀 Hooks 에서 loading 상태와 error 상태를 리듀서로 관리 하도록 변경 

### 위 익명함수를 함수로 빼서 설계 

```js
const fetchTodos = async () => {
    const errorMsg = ERROR_MSG.FETCh;
    // 2초간 loading 화면을 보여주기 위한 세팅
    await sleep();
    try {
      const response = await fetch(FetchUrl);
      if (!response.ok) throw new Error(errorMsg);

      const data = await response.json();

      if (!data.statusCode === 200) throw new Error(errorMsg);
      setTodos(data.body);
      setLoading(false);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);
```

### `useFetch` 라는 **custom hook** 만들기(다른 데서도 재사용) 

#### checkStatus 에러처리, 및 useFectch 수정 

 `fetch` 데이터 parsing 영역이 api 마다 다를 것이라 생각해서 callback 함수에 parsing을 정의할 까 고민했다. 그러나 callback을 외부에 작성하면 매 fetch API 요청 마다 parsing 로직을
재작성 해야하는데 이렇게 하면 hooks 를 재사용하는 의미가 없어진다. 

보통은 api가 
동일한 스키마를 가지고 있는게 일반적이며 api 구조가 달라질 useFetch 를
 수정하도록 하면 된다.

```js
function useFetch({ fetchUrl, deps = [] }) {
  const [state, dispatch] = useReducer(reducer, {
    loading: false,
    data: null,
    error: false
  });

  const fetchData = async () => {
    dispatch({ type: 'LOADING' });
    try {
      // 데이터 파싱 부분 useFetch 내부에 작성하도록 결정
      const response = await fetch(FetchUrl);
    	const data = await response.json();
      dispatch({ type: 'SUCCESS', data: data.body });
    } catch (e) {
      dispatch({ type: 'ERROR', error: e });
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, deps);

  return [state, fetchData];
}
```

### APP js 가 비대해졌다. 

**뭐가 문제일까?**

거의 대다수의 상태를 최상위 컴포넌트인 app 에서 관리하고 있다. TodoListTemplate 컴포넌트에 주입을 위해 app에 전부를 선언하다가 커져버렸다. 상태 변수를 쓰는 이벤트 콜백함수들도 모두 app 에서 선언되어 사용한다. 

**왜 이런 Template 컴포넌트를 썻는가?**

만약에 이걸 안한다면.. TodoListWrapper 란 컴포넌트를 만들게되어 children 내부에 모든걸 다 넣어줘야 한다. 이런식으로 말이다: `<TodoListWrapper><Form/><TodoList/></TodoListWrapper>` 물론 이런 방식, 전혀 문제되지 않는다.

그런데 예를 들어서 Form 과 TodoList 사이에 테두리를 설정한다고 했을 때 만약에 Template 컴포넌트를 사용하는 경우에 이런 스타일은 Template 내에서 주면 되겠지만, Wrapper 같은 컴포넌트를 사용하게 되면 해당 스타일을 Form 혹은 TodoList 쪽에 넣어줘야 한다.

**이 부분을 개선할 수 없을지 고민해보자** 

```js
const App = () => {
  const [todos, setTodos] = useState([]);
  const [folded, setFolded] = useState(false);
  const [value, setValue] = useState('');
  const [todosFetchState, refetch] = useFetch({ fetchUrl: FetchUrl });
  const { data, loading, error } = todosFetchState;
  useEffect(() => {
    setTodos(data);
    // eslint-disable-next-line
  }, [data]);

  const onChange = ({ target }) => {
    setValue(target.value);
  };

  const onCreate = () => {
			...
  };

  const onKeyPress = ({ key }) => {
			...
  };

  const onToggle = id => {
			...
  };

  const onRemove = id => {
			...
  };

  const onFold = () => {
   		...
  };

  return (
    <TodoListTemplate
      form={
        <Form
          value={value}
          onCreate={onCreate}
          onChange={onChange}
          onKeyPress={onKeyPress}
        />
      }
      status={<Status todos={todos} />}
      folded={folded}
      subtitle={<Subtitle folded={folded} onFold={onFold} />}
    >
      <TodoItemList
        onToggle={onToggle}
        onRemove={onRemove}
        todos={todos}
        loading={loading}
        error={error}
        refetch={refetch}
      />
    </TodoListTemplate>
  );
};
export default hot(App);

```

#### todos 와 setTodos 만 전달하자

todos 와 setTodos 만 props 전달하고 create, toggle, remove, keyPress 등의 메소드 들은 각 컴포넌트 내부에서 props 로 todos 와 setTodos를  전달받아 생성하도록 바꾸자. 결과적으로 app.js 의 비대해짐이 한결 나아졌다. 

### Context + useReducer 패턴 적용

사실 이제까지 진행 해 왔던  구조에서 props가 전달되는 depth 가 깊지 않아서 context 를 쓴 효과는 크지 않았다. 다만 기존 엔트리 포인트로서는 거대했던 App 컴포넌트의 크기가 줄어들고, 상태를 사용하는 컴포넌트에 상태에 관한 로직이 정리되서 타인이 확인할 때 편할 수 있겠다는 생각이 들었다. 

#### Context 이전 

![image](https://user-images.githubusercontent.com/35516239/64322359-62a27400-cffd-11e9-8808-1693ae84b905.png)

#### Context 이후

![image](https://user-images.githubusercontent.com/35516239/64322286-40105b00-cffd-11e9-9a28-6894270bad54.png)

#### useReducer 사용으로 로직이 정리됨 

reducer 내부에 todo 의 주요 상태 로직이 정의되어 있어 해당 로직을 한번에 파악하기 쉽고, 컴포넌트 내부는 view 에 집중할 수 있게 되는 장점이 있었다. 

```js
export default function todoReducer(state, action) {
  switch (action.type) {
    case 'TODO_UPLOAD':
      return state.concat(action.todos);
    case 'TODO_CREATE':
      return state.concat(action.todo);
    case 'TODO_TOGGLE':
      return state.map(todo =>
        todo.id === action.id
          ? { ...todo, status: todo.status === 'todo' ? 'done' : 'todo' }
          : todo
      );
    case 'TODO_REMOVE':
      return state.filter(todo => todo.id !== action.id);
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}
```



### Domcontentloaded 상황시에 CSS 미적용으로 인한 깜빡임 이슈

#### 1) 현상진단 

css가 미적용 된 상태로 dom이 로드되어 깜박임이 발생한다.  문제를 제대로 정의해보면 현재 css 는 webpack을 통해 번들링 된다.  webpack 내부적으로는 sass loader를 통해 scss 가  css 로 변경되고 css loader를 통해 css 가 js 파일로 번들링 된다. 해당 이슈는 아무래도 webpack 설정상의 문제일 가능성이 높다. 

![깜빡임 이슈](https://user-images.githubusercontent.com/35516239/63646773-1df02080-c753-11e9-9510-8cea1a563724.gif)


![image](https://user-images.githubusercontent.com/35516239/63646722-4deaf400-c752-11e9-83b8-a509a7295de3.png)

#### 2) 문제 파악 

일단 `stylesheet` 가 어떻게 로드되는지 확인해보자. 크롬 브라우저의 네트워크 탭을 조회했다. `stylesheet` 가 로드될 때 blob url을 통해 분리되어 로드되고 있다. 이것이 이슈가 될 수 있겠다

![stylesheet request as blob](https://user-images.githubusercontent.com/35516239/64843552-5f803700-d640-11e9-8873-1e526fe74a57.png)

#### 3) 해결과정 

**" react css blob"** 라는 키워드로 검색을 해서  [FOUC - JS chunks rendered before CSS has loaded, on development, references blobs instead of inline style #6399](https://github.com/facebook/create-react-app/issues/6399#issuecomment-463156035) 이슈를 발견했다. 여기서 **FOUC** 란 아래의 설명과  같다. 

> **FOUC**(Flash Of Unstyled Content)는 외부의 [CSS](https://ko.wikipedia.org/wiki/CSS)가 불러오기 전에 잠시 스타일이 적용되지 않은 웹 페이지가 나타나는 현상이다. 이 현상은 스타일이 적용되지 않은 웹 페이지가 스타일이 적용된 웹 페이지로 변화하는 것이다. [웹 브라우저](https://ko.wikipedia.org/wiki/웹_브라우저)가 웹 페이지에 스타일 정의를 부르고 적용할 때 보여지는 부분을 최대한 빨리 수정하지만, 이 변화는 짧지 않은 시간 동안 나타나므로 사용자는 페이지에 오류가 있다는 생각을 하게된다.

해당 링크에서 아래와 같은 답변을 참고하게 되었다.

> I don't know if this helps, but on `style-loader` they say:
>
> ℹ️ Source maps and assets referenced with url: when style loader is used with { options: { sourceMap: true } } option, the CSS modules will be generated as Blobs,
>
> Seems to be related to [webpack-contrib/style-loader#352](https://github.com/webpack-contrib/style-loader/issues/352)

css loader 옵션 중 debug를 위한 **souceMap** 옵션을 사용하면 css module이 Blob(Binary Large Object) 형태로 생성된다는 것이다. 이 [블로그](https://heropy.blog/2019/02/28/blob/)에 따르면 Blob은  **"데이터의 크기(Byte) 및 MIME 타입을 알아내거나, 데이터를 송수신을 위한 작은 Blob 객체로 나누는 등의 작업에 사용된다"** css loader 와 webpack의 역할은 모든 모듈을 하나의 파일로 합치는 것이다. souceMap 옵션은 디버깅을 위해 합쳐진 파일을 나눠야 한다. 개인적으로 나누기 위한 방법으로 CSS 모듈을 Blob으로 로드하는 것이 아닐까 생각해봤다. 

#### 4) 해결방법 

webpack 설정 중 css loader 의 `souceMap` 옵션 설정을 `false` 로 변경했다. 

![webpack sourceMap option](https://user-images.githubusercontent.com/35516239/64842954-b2f18580-d63e-11e9-82bd-0edddda9ed74.png)



#### 5) 결과 

loader.css.js 하나의 파일이 로더 되면서 **FOUC**(Flash Of Unstyled Content) 현상이 사라졌다. 

![css loader network tab](https://user-images.githubusercontent.com/35516239/64842915-8e95a900-d63e-11e9-80e3-1644868c0614.png)

사실 FOUC 는 개발단계에서 큰 문제가 되는 사항이 아니다. webpack의 prod mode 빌드시에 souceMap 옵션을 끄고 빌드하고, dev mode에서는 켜두자.

## 미션 진행중 기록 

### Hooks API 로 변경하며 느낀점 

state를 하나의 변수에 모아서 관리하지 않아도 된다. state의 value 가 객체안에 객체가 있는 구조일 경우 hooks 를 쓰면 depth를 줄이게 될 수 있다.

```js
// 기존 스테이트 관리
state = { input: '', todos: [], folded: false, loading: true };

// Hooks
const [todos, setTodos] = useState([]);
const [folded, setFolded] = useState(false);
const [loading, setLoading] = useState(true);
const [value, setValue] = useState('');


// 기존 클래스의 render method 내부에서 this로 부터 destructuring 해서 썻던 코드가 더 이상 필요없어졌다.  
const { input, todos, folded, loading } = this.state;
const { onChange, onCreate, onKeyPress, onToggle, onRemove, onFold } = this;

```

`componentDidMount ` 보다는 `useEffect` 가 더 직관적이다. 해당 함수는 sideEffect를 일으켜야 하는 함수로서, 더 명확한 것 같다. 

this를 사용하지 않아 this 에 대한 이해도가 없는 사람들에게 편한 것 같다. 

코드 크기가 확연하게 줄어든다. 

## Fold(Arcodian UI) Animation 이슈

### Displany : None 

- display: none 형태로 구현시에는 transition을 적용할 수 없다. 
- height를 변경해야 한다

### Height : auto

- height 0 &rarr; auto,  auto &rarr; height 0 사이에는 transition 적용이 안되는 이슈가 있다.

### ref 사용하여 height 값을 구한뒤에 적용해줘야 한다.

- 그러나 이렇게 해도, 초기값에 `${folded? ref.scrollHeigh : 0px}` 조건으로 초기에 folded false 인데도 animation이 펼쳐지지 않는 이슈
- todo 추가시에 이미 height 값이 고정되어 늘어나지 않는 이슈 
- 현재 미해결 상태  &rarr; snapshop 으로 commit 후 branch 생성 

### 참고 

- [poimaweb Acordian UI](https://poiemaweb.com/fastcampus-exercise/accordion-ui)
- [react ref API](https://reactjs.org/docs/refs-and-the-dom.html)
- [React Acordian UI](https://medium.com/skillthrive/build-a-react-accordion-component-from-scratch-using-react-hooks-a71d3d91324b) 

