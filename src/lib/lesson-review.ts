import {validateLesson,lessonLinks} from './lesson-media';
import {checkReferences} from './check-references';
export async function reviewLesson(body:string,published:boolean,reviewed:boolean,verify=checkReferences):Promise<string|undefined>{
 const errors=validateLesson(body);if(errors.length)return errors[0];
 if(!published)return;
 if(!reviewed)return 'Confirme a revisão da aula antes de publicar.';
 const failed=await verify(lessonLinks(body));
 if(failed.length)return `Publicação interrompida: não foi possível verificar ${failed.length} referência(s). Confira os links ou guarde como rascunho. ${failed.slice(0,2).join(' ')}`;
}
