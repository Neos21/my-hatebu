import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import * as moment from 'moment-timezone';

import { CategoriesService } from '../../../shared/services/categories.service';
import { Category } from '../../../shared/classes/category';
import { NgDataService } from '../../../shared/services/ng-data.service';
import { PageDataService } from '../../../shared/services/page-data.service';

/**
 * Home Component
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  /** 表示中のカテゴリのデータ */
  public currentCategory: Category = null;
  
  /** エラー時のフィードバックメッセージ */
  public errorMessage: string = '';
  
  /**
   * コンストラクタ
   * 
   * @param activatedRoute ActivatedRoute
   * @param pageDataService PageDataService
   * @param categoriesService CategoriesService
   * @param ngDataService NgDataService
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private pageDataService: PageDataService,
    private categoriesService: CategoriesService,
    private ngDataService: NgDataService
  ) { }
  
  /**
   * 画面初期表示時の処理
   */
  public ngOnInit(): void {
    this.activatedRoute.queryParamMap.subscribe((params: ParamMap) => {
      // クエリパラメータなしの場合もこの関数に辿り着くので null の場合は 1 をデフォルト表示にする
      const categoryId = params.get('categoryId') || '1';
      this.onShowCategory(categoryId);
    });
  }
  
  /**
   * カテゴリ別の記事一覧を取得する
   * 
   * @param categoryId カテゴリ ID
   */
  public onShowCategory(categoryId: string | number): void {
    this.errorMessage = '';  // ココでリセットしておけば全てのイベントに対応できる
    this.categoriesService.findById(categoryId)
      .then((category) => {
        // NG 情報を参照して除外していく
        const filteredEntries = category.entries
          .filter((entry) => {
            // 記事 URL が NG URL に合致する記事を省く
            return !this.ngDataService.ngUrls.some((ngUrl) => {
              return entry.url === ngUrl.url;
            });
          })
          .filter((entry) => {
            // NG ワードをタイトルに含む記事を省く
            return !this.ngDataService.ngWords.some((ngWord) => {
              return entry.title.includes(ngWord.word);
            });
          })
          .filter((entry) => {
            // NG ドメインを URL に含む記事を省く
            return !this.ngDataService.ngDomains.some((ngDomain) => {
              return entry.url.includes(ngDomain.domain);
            });
          });
        
        // 画面に設定する : 複製しないと参照が残っており、フィルタしたエントリ一覧をキャッシュしてしまう
        const currentCategory = Object.assign({}, category);
        // 最終クロール日時を JST にする
        currentCategory.updatedAt = moment(currentCategory.updatedAt).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss');
        // エントリの日付のフォーマットを修正して設定する
        currentCategory.entries = filteredEntries.map((entry) => {
          entry.date = moment(entry.date, 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD HH:mm');
          return entry;
        });
        
        // 画面に設定する
        this.currentCategory = currentCategory;
        // ページタイトルを渡す
        this.pageDataService.pageTitleSubject.next(currentCategory.name);
      })
      .catch((error) => {
        this.errorMessage = `指定のカテゴリのエントリ取得 : 失敗 : ${JSON.stringify(error)}`;
      });
  }
  
  /**
   * 選択した記事を NG URL に追加して削除する
   * 
   * @param url 削除する記事の URL
   */
  public onRemoveEntry(url: string): void {
    this.ngDataService.addNgUrl(url)
      .then(() => {
        // 記事削除処理完了・再表示することでフィルタする
        this.onShowCategory(this.currentCategory.id);
      });
  }
  
  /**
   * 指定のカテゴリ ID を再スクレイピングして表示する
   * 
   * @param categoryId カテゴリ ID
   */
  public onReloadEntries(categoryId: string|number): void {
    this.categoriesService.reloadById(categoryId)
      .then(() => {
        // 再スクレイピング成功・再表示することでフィルタ表示する
        this.onShowCategory(categoryId);
      })
      .catch((error) => {
        this.errorMessage = `再スクレイピング失敗 : ${JSON.stringify(error)}`;
      });
  }
}
