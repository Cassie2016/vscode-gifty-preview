import { AutocompletePlugin } from "@algolia/autocomplete-js";
import mocData from "../../common/ts/mock";
import { reactive } from "vue";
import fuzzysort from "fuzzysort";
// import HighlightComp from "./template";

const imgList = mocData;

type ImageMetaData = {
  remoteUrl: string;
  size: string;
  width: number;
  height: number;
  name: string;
  resourceKey: string;
  highlight?: string;
};

type GetProcessDataProps = {
  accept?: string;
  sort?: "stars" | "forks" | "help-wanted-issues" | "updated"; // 按照xx排序
  order?: "asc" | "desc"; // 正序倒序
  perPage?: number; // 一页展示多少条数据
  page?: number;
  params?: {};
  submitFn?: Function;
};

// 存储搜索词 和 搜索结果
const searchData = reactive({
  query: "",
  searchRes: mocData,
});

// 修改 搜索信息
const changeSearchData = (query: string, res: ImageMetaData[]) => {
  searchData.query = query;
  searchData.searchRes = res;
};

// 创建 AutocompletePlugin：处理 autocomplate 的 source 数据及钩子函数
const createAutocompletePlugin = (
  options: GetProcessDataProps = {}
): AutocompletePlugin<ImageMetaData, ImageMetaData[]> => {
  return {
    getSources() {
      return [
        {
          sourceId: "links",
          getItems({ query }) {
            const items = imgList;
            let results = fuzzysort.go(query, items, {
              keys: ["name"],
              // Create a custom combined score to sort by. -100 to the desc score makes it a worse match
              scoreFn: (a) =>
                Math.max(
                  a[0] ? a[0].score : -1000,
                  a[1] ? a[1].score - 100 : -1000
                ),
            });

            let arr1 = results.map((result) => {
              let highlight = fuzzysort.highlight(result[0]) || undefined;
              return {
                ...result.obj,
                highlight,
              };
            });
            let arr2 = arr1.filter((item) => item.highlight);

            return (
              (arr2.length &&
                arr2.filter(({ name }) =>
                  name.toLowerCase().includes(query.toLowerCase())
                )) ||
              []
            );
          },
          getItemUrl({ item }) {
            return item.remoteUrl;
          },
          templates: {
            item({ item }) {
              // return <HighlightComp htmlstring={item.highlight} />;
              return <p v-html={item.highlight}></p>
            },
          },
        },
      ];
    },
    onSubmit(e) {
      console.log("onSubmit query", e.state.query);
      console.log("onSubmit items", e.state.collections[0].items);

      const query = e.state.query;
      const res = e.state.collections[0].items;
      changeSearchData(query, res);
      options.submitFn && options.submitFn(query, res); // 触发搜索弹窗关闭的回调
    },
  };
};

export {
  createAutocompletePlugin,
  searchData,
  changeSearchData,
  ImageMetaData,
};